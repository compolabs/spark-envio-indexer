import { type CancelOrderEvent, type Order, Market, type User } from "generated";
import { getISOTime } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the CancelOrderEvent within a specific market
Market.CancelOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the user and order details for the specified market
	loader: async ({ event, context }) => {
		const user = await context.User.get(event.params.user.payload.bits);
		const order = await context.Order.get(event.params.order_id);
		return {
			user,
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
			id: getHash(`${event.transaction.id}-${nanoid()}`),
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
		const user = loaderReturn.user;
		const activeOrder = loaderReturn.activeOrder;

		// Remove the order from active orders depending on its type (Buy/Sell)
		if (activeOrder) {
			if (activeOrder.orderType === "Buy") {
				context.ActiveBuyOrder.deleteUnsafe(event.params.order_id);
			} else if (activeOrder.orderType === "Sell") {
				context.ActiveSellOrder.deleteUnsafe(event.params.order_id);
			}
		} else {
			context.log.error(`CANCEL. NO ACTIVE ORDER ${event.params.order_id}`);
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

			if (user) {
				const updatedUser: User = {
					...user,
					active: user.active - 1,
					canceled: user.canceled + 1,
					timestamp: getISOTime(event.block.time),
				};
				context.User.set(updatedUser);
			} else {
				context.log.error(`CANCEL. NO USER ${event.params.user.payload.bits}`);
			}
		} else {
			context.log.error(`CANCEL. NO ORDER ${event.params.order_id}`);
		}
	},
});
