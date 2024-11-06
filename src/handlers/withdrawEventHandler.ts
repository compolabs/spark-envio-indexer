import { type WithdrawEvent, Market } from "generated";
import { getISOTime } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the WithdrawEvent within a specific market
Market.WithdrawEvent.handlerWithLoader({
	loader: async ({ }) => { },

	// Handler function that processes the withdraw event and updates the user's balance
	handler: async ({ event, context }) => {
		// Construct the WithdrawEvent object and save in context for tracking
		const withdrawEvent: WithdrawEvent = {
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
		context.WithdrawEvent.set(withdrawEvent);
	},
});