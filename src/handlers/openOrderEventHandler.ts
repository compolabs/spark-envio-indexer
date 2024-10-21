import { type OpenOrderEvent, type Order, Market } from "generated";
import { getISOTime, updateUserBalance } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the OpenOrderEvent within a specific market
Market.OpenOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance data
	loader: async ({ event, context }) => {

		const baseEventId = event.transaction.id;
		let eventId = baseEventId;
		const existingEvent = await context.OpenOrderEvent.get(baseEventId);

		if (existingEvent) {
			eventId = getHash(`${event.transaction.id}-${nanoid()}`);
			context.log.info(`Using unique eventId in OPEN: ${eventId}`);
		}

		// Fetch the balance by generating a unique hash for the user and market (srcAddress)
		return { eventId, balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)) };
	},

	// Handler function that processes the evnet and updates the user's order and balance data
	handler: async ({ event, context, loaderReturn }) => {

		// Construct the OpenOrderEvent object and save in context for tracking
		const openOrderEvent: OpenOrderEvent = {
			id: loaderReturn.eventId,
			market: event.srcAddress,
			orderId: event.params.order_id,
			asset: event.params.asset.bits,
			amount: event.params.amount,
			orderType: event.params.order_type.case,
			price: event.params.price,
			user: event.params.user.payload.bits,
			baseAmount: event.params.balance.liquid.base,
			quoteAmount: event.params.balance.liquid.quote,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.OpenOrderEvent.set(openOrderEvent);

		// Retrieve the user's balance from the loader's return value
		const balance = loaderReturn.balance;

		// Construct the Order object and save in context for tracking
		const order: Order = {
			...openOrderEvent,
			id: event.params.order_id,
			initialAmount: event.params.amount,
			status: "Active",
		};
		context.Order.set(order);

		// Save the order in separate collections based on order type (Buy or Sell)
		if (event.params.order_type.case === "Buy") {
			context.ActiveBuyOrder.set(order);
		} else if (event.params.order_type.case === "Sell") {
			context.ActiveSellOrder.set(order);
		}

		// If balance exists, update it with the new base and quote amounts
		updateUserBalance("Open Event", context, event, balance, event.params.balance.liquid.base, event.params.balance.liquid.quote, event.params.user.payload.bits, event.block.time);
	},
});
