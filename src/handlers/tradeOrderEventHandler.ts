import { Market, type TradeOrderEvent, type Order, type ActiveBuyOrder, type ActiveSellOrder, type User } from "generated";
import { getISOTime, updateUserBalance } from "../utils";
import { getHash } from "../utils";
import { nanoid } from "nanoid";

// Define a handler for the TradeOrderEvent within a specific market
Market.TradeOrderEvent.handlerWithLoader({
	// Loader function to pre-fetch the necessary data for both buyer and seller
	loader: async ({ event, context }) => {
		const seller = await context.User.get(event.params.order_seller.payload.bits);
		const buyer = await context.User.get(event.params.order_buyer.payload.bits);

		// This line checks if the seller and buyer are the same user
		// If they are, it assigns the seller object to 'user', otherwise 'user' is undefined
		const user = event.params.order_seller.payload.bits === event.params.order_buyer.payload.bits ? seller : undefined;
		return {
			user,
			seller,
			buyer,
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

		// Construct the TradeOrderEvent object and save in context for tracking
		const tradeOrderEvent: TradeOrderEvent = {
			id: getHash(`${event.transaction.id}-${nanoid()}`),
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
		const seller = loaderReturn.seller;
		const buyer = loaderReturn.buyer;
		const user = loaderReturn.user;

		// Process the buy order, reducing the amount by the trade size and updating its status
		if (buyOrder && sellOrder) {
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

			// Update buyer's active and closed order counts if the buy order is closed and the buyer is not the seller
			if (buyer && event.params.order_buyer.payload.bits !== event.params.order_seller.payload.bits && isBuyOrderClosed) {
				const updatedBuyer: User = {
					...buyer,
					active: buyer.active - 1,
					closed: buyer.closed + 1,
					timestamp: getISOTime(event.block.time),
				};
				context.User.set(updatedBuyer);
			}

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

			// Update seller's active and closed order counts if the sell order is closed and the seller is not the buyer
			if (seller && event.params.order_buyer.payload.bits !== event.params.order_seller.payload.bits && isSellOrderClosed) {
				const updatedSeller: User = {
					...seller,
					active: seller.active - 1,
					closed: seller.closed + 1,
					timestamp: getISOTime(event.block.time),
				};
				context.User.set(updatedSeller);
			}

			// Update user's active and closed order counts if the user is both the buyer and seller
			if (user && isSellOrderClosed && isBuyOrderClosed) {
				const updatedUser: User = {
					...user,
					active: user.active - 2,
					closed: user.closed + 2,
					timestamp: getISOTime(event.block.time),
				};
				context.User.set(updatedUser);
			} else if (user && isSellOrderClosed && !isBuyOrderClosed) {
				const updatedUser: User = {
					...user,
					active: user.active - 1,
					closed: user.closed + 1,
					timestamp: getISOTime(event.block.time),
				};
				context.User.set(updatedUser);
			} else if (user && isBuyOrderClosed && !isSellOrderClosed) {
				const updatedUser: User = {
					...user,
					active: user.active - 1,
					closed: user.closed + 1,
					timestamp: getISOTime(event.block.time),
				};
				context.User.set(updatedUser);
			}

		} else {
			context.log.error(`TRADE. NO ORDER ${event.params.base_buy_order_id} OR ${event.params.base_sell_order_id}`);
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
			context.log.error(`TRADE. NO ACTIVE BUY ORDER ${event.params.base_buy_order_id}`);
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
			context.log.error(`TRADE. NO ACTIVE SELL ORDER ${event.params.base_sell_order_id}`);
		}

		// If balance exist, update the buyer and seller balance with the new base and quote amounts
		updateUserBalance("TRADE.", context, event, buyerBalance, event.params.b_balance.liquid.base, event.params.b_balance.liquid.quote, event.params.order_buyer.payload.bits, event.block.time);
		updateUserBalance("TRADE.", context, event, sellerBalance, event.params.s_balance.liquid.base, event.params.s_balance.liquid.quote, event.params.order_seller.payload.bits, event.block.time);
	},
});