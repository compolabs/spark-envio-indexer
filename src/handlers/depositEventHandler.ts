import { type DepositEvent, Market } from "generated";
import { getISOTime } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the DepositEvent within a specific market
Market.DepositEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance data
	loader: async ({ event, context }) => {

		const baseEventId = event.transaction.id;
		let eventId = baseEventId;
		const existingEvent = await context.DepositEvent.get(baseEventId);

		if (existingEvent) {
			eventId = getHash(`${event.transaction.id}-${nanoid()}`);
			context.log.info(`Using unique eventId in DEPOSIT: ${eventId}`);
		}

		// Fetch the balance by generating a unique hash for the user and market (srcAddress)
		return { eventId, balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)) };
	},

	// Handler function that processes the event and updates or creates balance data
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the DepositEvent object and save in context for tracking
		const depositEvent: DepositEvent = {
			id: loaderReturn.eventId,
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
	},
});
