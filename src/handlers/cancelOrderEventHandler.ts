import { type CancelOrderEvent, type Order, Market } from "generated";
import { getISOTime, updateUserBalance } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the CancelOrderEvent within a specific market
Market.CancelOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance and order details for the specified market
	loader: async ({ event, context }) => {

		const baseEventId = event.transaction.id;
		let eventId = baseEventId;
		const existingEvent = await context.CancelOrderEvent.get(baseEventId);

		if (existingEvent) {
			eventId = getHash(`${event.transaction.id}-${nanoid()}`);
			context.log.info(`Using unique eventId in CANCEL: ${eventId}`);
		}
		const order = await context.Order.get(event.params.order_id);
		return {
			eventId,
			balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)),
			order,
			activeOrder: order ? order.orderType === "Buy"
				? await context.ActiveBuyOrder.get(event.params.order_id)
				: await context.ActiveSellOrder.get(event.params.order_id)
				: null,
		};
	},

	// Handler function that processes the order cancellation event and updates the order and balance data
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the cancelOrderEvent object and save in context for tracking
		const cancelOrderEvent: CancelOrderEvent = {
			id: loaderReturn.eventId,
			market: event.srcAddress,
			user: event.params.user.payload.bits,
			orderId: event.params.order_id,
			baseAmount: event.params.balance.liquid.base,
			quoteAmount: event.params.balance.liquid.quote,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.CancelOrderEvent.set(cancelOrderEvent);

		// Retrieve the order and balance from the loader's return value
		const order = loaderReturn.order;
		const balance = loaderReturn.balance;
		const activeOrder = loaderReturn.activeOrder;

		// Remove the order from active orders depending on its type (Buy/Sell)
		if (activeOrder) {
			if (activeOrder.orderType === "Buy") {
				context.ActiveBuyOrder.deleteUnsafe(event.params.order_id);
			} else if (activeOrder.orderType === "Sell") {
				context.ActiveSellOrder.deleteUnsafe(event.params.order_id);
			}
		} else {
			context.log.error(`Cannot find an active order ${event.params.order_id}`);
		}

		// If the order exists, update its status to "Canceled" and reset its amount to 0
		if (order) {
			const updatedOrder: Order = {
				...order,
				amount: 0n,
				status: "Canceled",
				timestamp: getISOTime(event.block.time),
			};
			context.Order.set(updatedOrder);
		} else {
			context.log.error(`Cannot find an order ${event.params.order_id}`);
		}

		// If balance exists, update it with the new base and quote amounts
		updateUserBalance("Cancel Event", context, event, balance, event.params.balance.liquid.base, event.params.balance.liquid.quote, event.params.user.payload.bits, event.block.time);
	},
});
