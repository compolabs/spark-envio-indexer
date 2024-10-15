import { type CancelOrderEvent, type Order, Market } from "generated";
import type { OrderStatus_t } from "generated/src/db/Enums.gen";
import { getISOTime } from "../utils";
import { getHash } from "../utils";

// Define a handler for the CancelOrderEvent within a specific market
Market.CancelOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance and order details for the specified market
	loader: async ({ event, context }) => {
		const order = await context.Order.get(event.params.order_id);
		return {
			balance: await context.Balance.get(
				getHash(`${event.params.user.payload.bits}-${event.srcAddress}`),
			),
			order,
			activeOrder: order
				? order.order_type === "Buy"
					? await context.ActiveBuyOrder.get(event.params.order_id)
					: await context.ActiveSellOrder.get(event.params.order_id)
				: null,
		};
	},

	// Handler function that processes the order cancellation event and updates the order and balance data
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the cancelOrderEvent object and save in context for tracking
		const cancelOrderEvent: CancelOrderEvent = {
			id: event.transaction.id,
			market: event.srcAddress,
			user: event.params.user.payload.bits,
			order_id: event.params.order_id,
			base_amount: event.params.balance.liquid.base,
			quote_amount: event.params.balance.liquid.quote,
			timestamp: getISOTime(event.block.time),
		};
		context.CancelOrderEvent.set(cancelOrderEvent);

		// Retrieve the order and balance from the loader's return value
		const order = loaderReturn.order;
		const balance = loaderReturn.balance;
		const activeOrder = loaderReturn.activeOrder;

		// Remove the order from active orders depending on its type (Buy/Sell)
		if (activeOrder) {
			if (activeOrder.order_type === "Buy") {
				context.ActiveBuyOrder.deleteUnsafe(event.params.order_id);
			} else if (activeOrder.order_type === "Sell") {
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
				status: "Canceled" as OrderStatus_t,
				timestamp: getISOTime(event.block.time),
			};
			context.Order.set(updatedOrder);
		} else {
			context.log.error(`Cannot find an order ${event.params.order_id}`);
		}

		// If the user's balance exists, update the balance with the new base and quote amounts
		if (balance) {
			const updatedBalance = {
				...balance,
				base_amount: event.params.balance.liquid.base,
				quote_amount: event.params.balance.liquid.quote,
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
