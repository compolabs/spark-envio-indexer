import {
  WithdrawEvent,
  Market
} from "generated";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

Market.WithdrawEvent.handlerWithLoader(
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
        id: event.transaction.id,
        market: event.srcAddress,
        user: event.params.user.payload.bits,
        amount: event.params.amount,
        asset: event.params.asset.bits,
        base_amount: event.params.account.liquid.base,
        quote_amount: event.params.account.liquid.quote,
        timestamp: getISOTime(event.block.time),
        // tx_id: event.transaction.id,
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
        context.log.error(`Cannot find balance in WITHDRAW: ${getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)}`);
      }

    }
  }
)