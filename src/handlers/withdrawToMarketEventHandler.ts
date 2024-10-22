import { type WithdrawToMarketEvent, Market } from "generated";
import { getISOTime, updateUserBalance } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the WithdrawToMarketEvent within a specific market
Market.WithdrawToMarketEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance for the specified market
	loader: async ({ event, context }) => {
		// Fetch the balance using a unique hash based on the user and market (srcAddress)
		return { balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)) }
	},

	// Handler function that processes the event and updates the user's balance
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the WithdrawToMarketEvent object and save in context for tracking
		const withdrawToMarketEvent: WithdrawToMarketEvent = {
			id: getHash(`${event.transaction.id}-${nanoid()}`),
			market: event.srcAddress,
			toMarket: event.params.market.bits,
			user: event.params.user.payload.bits,
			amount: event.params.amount,
			asset: event.params.asset.bits,
			baseAmount: event.params.account.liquid.base,
			quoteAmount: event.params.account.liquid.quote,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.WithdrawToMarketEvent.set(withdrawToMarketEvent);

		// Retrieve the user's balance from the loader's return value
		const balance = loaderReturn.balance;

		// If balance exists, update it with the new base and quote amounts
		updateUserBalance("WithdrawTo Event", context, event, balance, event.params.account.liquid.base, event.params.account.liquid.quote, event.params.user.payload.bits, event.block.time);
	},
});
