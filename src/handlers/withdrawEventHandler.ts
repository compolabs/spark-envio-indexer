import {
  WithdrawEvent,
  OrderBook
} from "generated";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

OrderBook.WithdrawEvent.handlerWithLoader(
  {
    loader: async ({
      event,
      context,
    }) => {
      return {
        balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`))
      }
    },

    handler: async ({
      event,
      context,
      loaderReturn
    }) => {
      const withdrawEvent: WithdrawEvent = {
        id: nanoid(),
        market: event.srcAddress,
        user: event.params.user.payload.bits,
        amount: event.params.amount,
        asset: event.params.asset.bits,
        base_amount: event.params.account.liquid.base,
        quote_amount: event.params.account.liquid.quote,
        tx_id: event.transaction.id,
        timestamp: getISOTime(event.block.time),
      };

      context.WithdrawEvent.set(withdrawEvent);
      const balance = loaderReturn.balance;

      if (balance) {
        const updatedBalance = {
          ...balance,
          base_amount: event.params.account.liquid.base,
          quote_amount: event.params.account.liquid.quote,
          timestamp: getISOTime(event.block.time),
        };
        context.Balance.set(updatedBalance);
      } else {
        context.log.error(`Cannot find an balance ${event.params.user.payload.bits}`);
      }
    }
  }
)