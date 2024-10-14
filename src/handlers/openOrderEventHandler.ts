import { type OpenOrderEvent, type Order, type DustBuyOrder, type DustSellOrder, Market } from "generated";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

// Define a handler for the OpenOrderEvent within a specific market
Market.OpenOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance data
	loader: async ({ event, context }) => {
		return {
			// Fetch the balance by generating a unique hash for the user and market (srcAddress)
			balance: await context.Balance.get(
				getHash(`${event.params.user.payload.bits}-${event.srcAddress}`),
			),
		};
	},

	// Handler function that processes the evnet and updates the user's order and balance data
	handler: async ({ event, context, loaderReturn }) => {
		const orderType = event.params.order_type.case;
		const isDustOrder = event.params.amount < 1000n;
		const orderStatus = isDustOrder ? "Dust" : "Active";

		// Construct the OpenOrderEvent object and save in context for tracking
		const openOrderEvent: OpenOrderEvent = {
			id: event.transaction.id,
			market: event.srcAddress,
			order_id: event.params.order_id,
			asset: event.params.asset.bits,
			amount: event.params.amount,
			order_type: orderType,
			price: event.params.price,
			user: event.params.user.payload.bits,
			base_amount: event.params.balance.liquid.base,
			quote_amount: event.params.balance.liquid.quote,
			timestamp: getISOTime(event.block.time),
		};
		context.OpenOrderEvent.set(openOrderEvent);

		// Retrieve the user's balance from the loader's return value
		const balance = loaderReturn.balance;

		// Construct the Order object and save in context for tracking
		const order: Order = {
			...openOrderEvent,
			id: event.params.order_id,
			initial_amount: event.params.amount,
			status: orderStatus,
			timestamp: getISOTime(event.block.time),
		};
		context.Order.set(order);

		if (isDustOrder) {
			if (orderType === "Buy") {
				context.DustBuyOrder.set(order);
			} else if (orderType === "Sell") {
				context.DustSellOrder.set(order);
			}
		} else {
			if (orderType === "Buy") {
				context.ActiveBuyOrder.set(order);
			} else if (orderType === "Sell") {
				context.ActiveSellOrder.set(order);
			}
		}

		// If a balance exists, update it with the new base and quote amounts
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
