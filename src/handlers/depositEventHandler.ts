import {
  DepositEvent,
  OrderBook
} from "generated";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

// Define a handler for the DepositEvent within a specific market
Market.DepositEvent.handlerWithLoader(
  {
    // Loader function to pre-fetch the user's balance data
    loader: async ({
      event,
      context,
    }) => {
      return {
        // Fetch the balance by generating a unique hash for the user and market (srcAddress)
        balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`))
      }
    },

    // Handler function that processes the event and updates or creates balance data
    handler: async ({
      event,
      context,
      loaderReturn
    }) => {
      // Construct the DepositEvent object and save in context for tracking
      const depositEvent: DepositEvent = {
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
      context.DepositEvent.set(depositEvent);

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
        // If no balance exists, create a new balance record
        context.Balance.set({
          ...depositEvent,
          id: getHash(`${event.params.user.payload.bits}-${event.srcAddress}`),
        });
      }
    }
  }
)