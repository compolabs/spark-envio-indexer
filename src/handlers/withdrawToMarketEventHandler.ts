import { type WithdrawToMarketEvent, Market } from "generated";
import { getISOTime } from "../utils";
import { getHash } from "../utils";

// Define a handler for the WithdrawToMarketEvent within a specific market
Market.WithdrawToMarketEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance for the specified market
	loader: async ({ event, context }) => {
		return {
			// Fetch the balance using a unique hash based on the user and market (srcAddress)
			balance: await context.Balance.get(
				getHash(`${event.params.user.payload.bits}-${event.srcAddress}`),
			),
		};
	},

	// Handler function that processes the event and updates the user's balance
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the WithdrawToMarketEvent object and save in context for tracking
		const withdrawToMarketEvent: WithdrawToMarketEvent = {
			id: event.transaction.id,
			market: event.srcAddress,
			to_market: event.params.market.bits,
			user: event.params.user.payload.bits,
			amount: event.params.amount,
			asset: event.params.asset.bits,
			base_amount: event.params.account.liquid.base,
			quote_amount: event.params.account.liquid.quote,
			timestamp: getISOTime(event.block.time),
		};
		context.WithdrawToMarketEvent.set(withdrawToMarketEvent);

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
			context.log.error(
				`Cannot find an balance ${event.params.user.payload.bits}`,
			);
		}
	},
});
