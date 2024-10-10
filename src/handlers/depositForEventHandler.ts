import { type DepositForEvent, Market } from "generated";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

// Define a handler for the DepositForEvent within a specific market
Market.DepositForEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance data
	loader: async ({ event, context }) => {
		return {
			// Fetch the balance by generating a unique hash for the user and market (srcAddress)
			balance: await context.Balance.get(
				getHash(`${event.params.user.payload.bits}-${event.srcAddress}`),
			),
		};
	},

	// Handler function that processes the event and updates or creates balance data
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the DepositForEvent object and save in context for tracking
		const depositForEvent: DepositForEvent = {
			id: event.transaction.id,
			market: event.srcAddress,
			user: event.params.user.payload.bits,
			amount: event.params.amount,
			asset: event.params.asset.bits,
			base_amount: event.params.account.liquid.base,
			quote_amount: event.params.account.liquid.quote,
			caller: event.params.caller.payload.bits,
			timestamp: getISOTime(event.block.time),
		};
		context.DepositForEvent.set(depositForEvent);

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
				...depositForEvent,
				id: getHash(`${event.params.user.payload.bits}-${event.srcAddress}`),
			});
		}
	},
});
