import {
	Market, type TradeOrderEvent, type Order, type ActiveBuyOrder, type ActiveSellOrder
} from "generated";
import { getISOTime, updateUserBalance } from "../utils";
import { getHash } from "../utils";

function generateUniqueId(baseId: string, counter: number): string {
	return getHash(`${baseId}-${counter}`);
}

// Define a handler for the TradeOrderEvent within a specific market
Market.TradeOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the necessary data for both buyer and seller
	loader: async ({ event, context }) => {
		const baseEventId = getHash(`${event.transaction.id}-${event.params.base_sell_order_id}-${event.params.base_buy_order_id}`);

		let counter = 0;
		let eventId = baseEventId;
		let existingTradeEvent = await context.TradeOrderEvent.get(eventId);

		while (existingTradeEvent) {
			counter += 1;
			eventId = generateUniqueId(baseEventId, counter);
			existingTradeEvent = await context.TradeOrderEvent.get(eventId);
		}

		if (eventId !== baseEventId) {
			context.log.info(`Generated unique event id: ${eventId} (baseEventId was: ${baseEventId})`);
		}

		return {
			eventId,
			// Fetch balances for both the seller and the buyer in the market (srcAddress)
			sellerBalance: await context.Balance.get(getHash(`${event.params.order_seller.payload.bits}-${event.srcAddress}`)),
			buyerBalance: await context.Balance.get(getHash(`${event.params.order_buyer.payload.bits}-${event.srcAddress}`)),

			// Fetch both the buy and sell orders using their respective order IDs
			sellOrder: await context.Order.get(event.params.base_sell_order_id),
			buyOrder: await context.Order.get(event.params.base_buy_order_id),

			activeSellOrder: await context.ActiveSellOrder.get(event.params.base_sell_order_id),
			activeBuyOrder: await context.ActiveBuyOrder.get(event.params.base_buy_order_id),
		};
	},

	// Handler function that processes the trade event and updates orders and balances
	handler: async ({ event, context, loaderReturn }) => {
		const eventId = loaderReturn.eventId;

		// Construct the TradeOrderEvent object and save in context for tracking
		const tradeOrderEvent: TradeOrderEvent = {
			id: eventId,
			market: event.srcAddress,
			sellOrderId: event.params.base_sell_order_id,
			buyOrderId: event.params.base_buy_order_id,
			tradeSize: event.params.trade_size,
			tradePrice: event.params.trade_price,
			seller: event.params.order_seller.payload.bits,
			sellerIsMaker: event.params.seller_is_maker,
			buyer: event.params.order_buyer.payload.bits,
			sellerBaseAmount: event.params.s_balance.liquid.base,
			sellerQuoteAmount: event.params.s_balance.liquid.quote,
			buyerBaseAmount: event.params.b_balance.liquid.base,
			buyerQuoteAmount: event.params.b_balance.liquid.quote,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.TradeOrderEvent.set(tradeOrderEvent);

		// Retrieve the buy and sell orders from the loader's return value
		const buyOrder = loaderReturn.buyOrder;
		const sellOrder = loaderReturn.sellOrder;
		const activeBuyOrder = loaderReturn.activeBuyOrder;
		const activeSellOrder = loaderReturn.activeSellOrder;

		// Retrieve the balances for both the seller and the buyer from the loader's return value
		const sellerBalance = loaderReturn.sellerBalance;
		const buyerBalance = loaderReturn.buyerBalance;

		// Process the buy order, reducing the amount by the trade size and updating its status
		if (buyOrder) {
			const updatedBuyAmount = buyOrder.amount - event.params.trade_size;
			const isBuyOrderClosed = updatedBuyAmount === 0n;

			// Update the buy order status to "Closed" if fully executed, otherwise "Active"
			const updatedBuyOrder: Order = {
				...buyOrder,
				amount: updatedBuyAmount,
				status: isBuyOrderClosed ? "Closed" : "Active",
				timestamp: getISOTime(event.block.time),
			};
			context.Order.set(updatedBuyOrder);
		} else {
			context.log.error(`Cannot find buy order ${event.params.base_buy_order_id}`);
		}

		// Process the active buy order, reducing the amount by the trade size and updating its status
		if (activeBuyOrder) {
			const updatedActiveBuyAmount = activeBuyOrder.amount - event.params.trade_size;
			const isActiveBuyOrderClosed = updatedActiveBuyAmount === 0n;

			const updatedActiveBuyOrder: ActiveBuyOrder = {
				...activeBuyOrder,
				amount: updatedActiveBuyAmount,
				status: isActiveBuyOrderClosed ? "Closed" : "Active",
				timestamp: getISOTime(event.block.time),
			};
			context.ActiveBuyOrder.set(updatedActiveBuyOrder);

			// Remove the buy order from active orders if fully executed
			if (isActiveBuyOrderClosed) {
				context.ActiveBuyOrder.deleteUnsafe(activeBuyOrder.id);
			} else {
				context.ActiveBuyOrder.set(updatedActiveBuyOrder);
			}
		} else {
			context.log.error(`Cannot find active buy order ${event.params.base_buy_order_id}`);
		}

		// Process the sell order similarly, updating its amount and status
		if (sellOrder) {
			const updatedSellAmount = sellOrder.amount - event.params.trade_size;
			const isSellOrderClosed = updatedSellAmount === 0n;

			// Update the sell order status to "Closed" if fully executed, otherwise "Active"
			const updatedSellOrder: Order = {
				...sellOrder,
				amount: updatedSellAmount,
				status: isSellOrderClosed ? "Closed" : "Active",
				timestamp: getISOTime(event.block.time),
			};
			context.Order.set(updatedSellOrder);
		} else {
			context.log.error(`Cannot find sell order ${event.params.base_sell_order_id}`);
		}

		// Process the active sell order, reducing the amount by the trade size and updating its status
		if (activeSellOrder) {
			const updatedActiveSellAmount = activeSellOrder.amount - event.params.trade_size;
			const isActiveSellOrderClosed = updatedActiveSellAmount === 0n;

			const updatedActiveSellOrder: ActiveSellOrder = {
				...activeSellOrder,
				amount: updatedActiveSellAmount,
				status: isActiveSellOrderClosed ? "Closed" : "Active",
				timestamp: getISOTime(event.block.time),
			};
			context.ActiveSellOrder.set(updatedActiveSellOrder);

			// Remove the sell order from active orders if fully executed
			if (isActiveSellOrderClosed) {
				context.ActiveSellOrder.deleteUnsafe(activeSellOrder.id);
			} else {
				context.ActiveSellOrder.set(updatedActiveSellOrder);
			}
		} else {
			context.log.error(`Cannot find active sell order ${event.params.base_sell_order_id}`);
		}

		// If balance exist, update the buyer and seller balance with the new base and quote amounts
		updateUserBalance("Trade Event", context, event, buyerBalance, event.params.b_balance.liquid.base, event.params.b_balance.liquid.quote, event.params.order_buyer.payload.bits, event.block.time);
		updateUserBalance("Trade Event", context, event, sellerBalance, event.params.s_balance.liquid.base, event.params.s_balance.liquid.quote, event.params.order_seller.payload.bits, event.block.time);
	},
});
