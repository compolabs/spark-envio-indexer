import {
  WithdrawEvent,
  Market
} from "generated";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

// Define a handler for the WithdrawEvent within a specific market
Market.WithdrawEvent.handlerWithLoader(
  {
    // Loader function to pre-fetch the user's balance for the specified market
    loader: async ({
      event,
      context,
    }) => {
      return {
        // Fetch the balance using a unique hash based on the user and market (srcAddress)
        balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`))
      }
    },

    // Handler function that processes the withdraw event and updates the user's balance
    handler: async ({
      event,
      context,
      loaderReturn
    }) => {
      // Construct the WithdrawEvent object and save in context for tracking
      const withdrawEvent: WithdrawEvent = {
        id: event.transaction.id,
        market: event.srcAddress,
        user: event.params.user.payload.bits,
        amount: event.params.amount,
        asset: event.params.asset.bits,
        base_amount: event.params.account.liquid.base,
        quote_amount: event.params.account.liquid.quote,
        timestamp: getISOTime(event.block.time),
      };
      context.WithdrawEvent.set(withdrawEvent);
      
      // Retrieve the user's balance from the loader's return value
      const balance = loaderReturn.balance;

      // If balance exists, update it with the new base and quote amounts
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