import {
  WithdrawEvent,
  OrderBook
} from "generated";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

OrderBook.WithdrawEvent.handlerWithLoader(
  {
    loader: async ({
      event,
      context,
    }) => {
      return {
        balance: await context.Balance.get(event.params.user.payload.bits)
      }
    },

    handler: async ({
      event,
      context,
      loaderReturn
    }) => {
      const withdrawEvent: WithdrawEvent = {
        id: nanoid(),
        user: event.params.user.payload.bits,
        amount: event.params.amount,
        asset: event.params.asset.bits,
        base_amount: event.params.balance.liquid.base,
        quote_amount: event.params.balance.liquid.quote,
        tx_id: event.transaction.id,
        timestamp: getISOTime(event.block.time),
      };

      context.WithdrawEvent.set(withdrawEvent);
      const balance = loaderReturn.balance;

      if (!balance) {
        context.log.error(`Cannot find an balance ${event.params.user.payload.bits}`);
        return
      }

      const updatedBalance = {
        ...balance,
        base_amount: event.params.balance.liquid.base,
        quote_amount: event.params.balance.liquid.quote,
        timestamp: getISOTime(event.block.time),
      };
      context.Balance.set(updatedBalance);
    }
  }
)