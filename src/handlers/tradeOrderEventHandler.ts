import { type TradeOrderEvent, type Order, Market, type ActiveBuyOrder, type ActiveSellOrder, type DustBuyOrder, type DustSellOrder } from "generated";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

// Define a handler for the TradeOrderEvent within a specific market
Market.TradeOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the necessary data for both buyer and seller
	loader: async ({ event, context }) => {
		return {
			// Fetch balances for both the seller and the buyer in the market (srcAddress)
			seller_balance: await context.Balance.get(
				getHash(
					`${event.params.order_seller.payload.bits}-${event.srcAddress}`,
				),
			),
			buyer_balance: await context.Balance.get(
				getHash(`${event.params.order_buyer.payload.bits}-${event.srcAddress}`),
			),

			// Fetch both the buy and sell orders using their respective order IDs
			sell_order: await context.Order.get(event.params.base_sell_order_id),
			buy_order: await context.Order.get(event.params.base_buy_order_id),

			active_sell_order: await context.ActiveSellOrder.get(event.params.base_sell_order_id),
			active_buy_order: await context.ActiveBuyOrder.get(event.params.base_buy_order_id),
		};
	},

	// Handler function that processes the trade event and updates orders and balances
	handler: async ({ event, context, loaderReturn }) => {
		// Construct the TradeOrderEvent object and save in context for tracking
		const tradeOrderEvent: TradeOrderEvent = {
			id: event.transaction.id,
			market: event.srcAddress,
			sell_order_id: event.params.base_sell_order_id,
			buy_order_id: event.params.base_buy_order_id,
			trade_size: event.params.trade_size,
			trade_price: event.params.trade_price,
			seller: event.params.order_seller.payload.bits,
			buyer: event.params.order_buyer.payload.bits,
			seller_base_amount: event.params.s_balance.liquid.base,
			seller_quote_amount: event.params.s_balance.liquid.quote,
			buyer_base_amount: event.params.b_balance.liquid.base,
			buyer_quote_amount: event.params.b_balance.liquid.quote,
			timestamp: getISOTime(event.block.time),
		};
		context.TradeOrderEvent.set(tradeOrderEvent);

		// Retrieve the buy and sell orders from the loader's return value
		const active_buy_order = loaderReturn.active_buy_order;
		const active_sell_order = loaderReturn.active_sell_order;
		const buy_order = loaderReturn.buy_order;
		const sell_order = loaderReturn.sell_order;

		// Retrieve the balances for both the seller and the buyer from the loader's return value
		const seller_balance = loaderReturn.seller_balance;
		const buyer_balance = loaderReturn.buyer_balance;

		// Process the active buy order, reducing the amount by the trade size and updating its status
		if (active_buy_order) {
			const updatedActiveBuyAmount = active_buy_order.amount - event.params.trade_size;

			if (updatedActiveBuyAmount < 1000000n) {
				const dustBuyOrder: DustBuyOrder = {
					...active_buy_order,
					amount: updatedActiveBuyAmount,
					status: "Dust",
					timestamp: getISOTime(event.block.time),
				};
				context.DustBuyOrder.set(dustBuyOrder);
				context.ActiveBuyOrder.deleteUnsafe(active_buy_order.id);

			} else {
				const updatedActiveBuyOrder: ActiveBuyOrder = {
					...active_buy_order,
					amount: updatedActiveBuyAmount,
					status: updatedActiveBuyAmount === 0n ? "Closed" : "Active",
					timestamp: getISOTime(event.block.time),
				};
				context.ActiveBuyOrder.set(updatedActiveBuyOrder);
			}
		}

		// Process the active sell order, reducing the amount by the trade size and updating its status
		if (active_sell_order) {
			const updatedActiveSellAmount = active_sell_order.amount - event.params.trade_size;

			if (updatedActiveSellAmount < 1000000n) {
				const dustSellOrder: DustSellOrder = {
					...active_sell_order,
					amount: updatedActiveSellAmount,
					status: "Dust",
					timestamp: getISOTime(event.block.time),
				};
				context.DustSellOrder.set(dustSellOrder);
				context.ActiveSellOrder.deleteUnsafe(active_sell_order.id);

			} else {
				const updatedActiveSellOrder: ActiveSellOrder = {
					...active_sell_order,
					amount: updatedActiveSellAmount,
					status: updatedActiveSellAmount === 0n ? "Closed" : "Active",
					timestamp: getISOTime(event.block.time),
				};
				context.ActiveSellOrder.set(updatedActiveSellOrder);
			}
		}

		// Process the buy order, reducing the amount by the trade size and updating its status
		if (buy_order) {
			const updatedBuyAmount = buy_order.amount - event.params.trade_size;

			if (updatedBuyAmount < 1_000_000n) {
				const updatedBuyOrder: Order = {
					...buy_order,
					amount: updatedBuyAmount,
					status: "Dust",
					timestamp: getISOTime(event.block.time),
				};
				context.Order.set(updatedBuyOrder);

			} else {
				const isBuyOrderClosed = updatedBuyAmount === 0n;
				const updatedBuyOrder: Order = {
					...buy_order,
					amount: updatedBuyAmount,
					status: isBuyOrderClosed ? "Closed" : "Active",
					timestamp: getISOTime(event.block.time),
				};
				context.Order.set(updatedBuyOrder);
			}

		} else {
			context.log.error(
				`Cannot find buy order ${event.params.base_buy_order_id}`,
			);
		}

		// Process the sell order similarly, updating its amount and status
		if (sell_order) {
			const updatedSellAmount = sell_order.amount - event.params.trade_size;

			if (updatedSellAmount < 1_000_000n) {
				const updatedSellOrder: Order = {
					...sell_order,
					amount: updatedSellAmount,
					status: "Dust",
					timestamp: getISOTime(event.block.time),
				};
				context.Order.set(updatedSellOrder);

			} else {
				const isSellOrderClosed = updatedSellAmount === 0n;
				const updatedSellOrder: Order = {
					...sell_order,
					amount: updatedSellAmount,
					status: isSellOrderClosed ? "Closed" : "Active",
					timestamp: getISOTime(event.block.time),
				};
				context.Order.set(updatedSellOrder);
			}
		} else {
			context.log.error(
				`Cannot find sell order ${event.params.base_sell_order_id}`,
			);
		}


		// Update the buyer's balance with the new base and quote amounts
		if (buyer_balance) {
			const updatedBuyerBalance = {
				...buyer_balance,
				base_amount: event.params.b_balance.liquid.base,
				quote_amount: event.params.b_balance.liquid.quote,
				timestamp: getISOTime(event.block.time),
			};
			context.Balance.set(updatedBuyerBalance);
		} else {
			context.log.error(
				`Cannot find buyer balance ${getHash(`${event.params.order_buyer.payload.bits}-${event.srcAddress}`)}`,
			);
		}

		// Update the seller's balance with the new base and quote amounts
		if (seller_balance) {
			const updatedSellerBalance = {
				...seller_balance,
				base_amount: event.params.s_balance.liquid.base,
				quote_amount: event.params.s_balance.liquid.quote,
				timestamp: getISOTime(event.block.time),
			};
			context.Balance.set(updatedSellerBalance);
		} else {
			context.log.error(
				`Cannot find seller balance ${getHash(`${event.params.order_seller.payload.bits}-${event.srcAddress}`)}`,
			);
		}
	},
});
