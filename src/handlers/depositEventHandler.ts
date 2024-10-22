import { type DepositEvent, Market } from "generated";
import { getISOTime } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the DepositEvent within a specific market
Market.DepositEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance data
	loader: async ({ event, context }) => {
		const user = await context.User.get(event.params.user.payload.bits);
		// Fetch the balance by generating a unique hash for the user and market (srcAddress)
		return { user, balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)) };
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

		// Retrieve the user's balance from the loader's return value
		const balance = loaderReturn.balance;
		const user = loaderReturn.user;

		// If balance exists, update it with the new base and quote amounts
		if (balance) {
			const updatedBalance = {
				...balance,
				baseAmount: event.params.account.liquid.base,
				quoteAmount: event.params.account.liquid.quote,
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
