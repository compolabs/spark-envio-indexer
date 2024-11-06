import { type WithdrawToMarketEvent, Market } from "generated";
import { getISOTime } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the WithdrawToMarketEvent within a specific market
Market.WithdrawToMarketEvent.handlerWithLoader({
	loader: async ({ }) => { },

	// Handler function that processes the event and updates the user's balance
	handler: async ({ event, context }) => {
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
	},
});