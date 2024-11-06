import { type DepositEvent, Market } from "generated";
import { getISOTime } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the DepositEvent within a specific market
Market.DepositEvent.handlerWithLoader({
	// Loader function to pre-fetch the user
	loader: async ({ event, context }) => {
		const user = await context.User.get(event.params.user.payload.bits);
		return { user };
	},

	// Handler function that processes the event and updates or creates balance data
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the DepositEvent object and save in context for tracking
		const depositEvent: DepositEvent = {
			id: getHash(`${event.transaction.id}-${nanoid()}`),
			market: event.srcAddress,
			user: event.params.user.payload.bits,
			amount: event.params.amount,
			asset: event.params.asset.bits,
			baseAmount: event.params.account.liquid.base,
			quoteAmount: event.params.account.liquid.quote,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.DepositEvent.set(depositEvent);

		// Retrieve the user from the loader's return value
		const user = loaderReturn.user;

		if (!user) {
			context.User.set({
				id: event.params.user.payload.bits,
				active: 0,
				closed: 0,
				canceled: 0,
				timestamp: getISOTime(event.block.time),
			});
		}
	},
});
