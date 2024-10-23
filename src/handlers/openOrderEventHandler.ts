import { type OpenOrderEvent, type Order, Market, type User } from "generated";
import { getISOTime, updateUserBalance } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the OpenOrderEvent within a specific market
Market.OpenOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the user's balance data
	loader: async ({ event, context }) => {
		// Fetch the balance by generating a unique hash for the user and market (srcAddress)
		const user = await context.User.get(event.params.user.payload.bits);
		return { user, balance: await context.Balance.get(getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)) };
	},

	// Handler function that processes the evnet and updates the user's order and balance data
	handler: async ({ event, context, loaderReturn }) => {

		// Construct the OpenOrderEvent object and save in context for tracking
		const openOrderEvent: OpenOrderEvent = {
			id: getHash(`${event.transaction.id}-${nanoid()}`),
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
		const user = loaderReturn.user;

		// Construct the Order object and save in context for tracking
		const order: Order = {
			...openOrderEvent,
			id: event.params.order_id,
			initialAmount: event.params.amount,
			status: "Active",
		};
		context.Order.set(order);

		if (user) {
			const updatedUser: User = {
				...user,
				active: user.active + 1,
				timestamp: getISOTime(event.block.time),
			};
			context.User.set(updatedUser);
		} else {
			context.log.error(`OPEN. NO USER ${event.params.user.payload.bits}`);
		}

		// Save the order in separate collections based on order type (Buy or Sell)
		if (event.params.order_type.case === "Buy") {
			context.ActiveBuyOrder.set(order);
		} else if (event.params.order_type.case === "Sell") {
			context.ActiveSellOrder.set(order);
		}

		// If balance exists, update it with the new base and quote amounts
		updateUserBalance("OPEN.", context, event, balance, event.params.balance.liquid.base, event.params.balance.liquid.quote, event.params.user.payload.bits, event.block.time);
	},
});
