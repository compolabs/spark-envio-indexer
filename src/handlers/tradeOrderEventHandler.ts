import {
  TradeOrderEvent,
  Order,
  Market
} from "generated";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from '../utils/getHash';

// Define a handler for the TradeOrderEvent within a specific market
Market.TradeOrderEvent.handlerWithLoader(
  {
    // Loader function to pre-fetch the necessary data for both buyer and seller
    loader: async ({
      event,
      context,
    }) => {
      return {
        // Fetch balances for both the seller and the buyer in the market (srcAddress)
        seller_balance: await context.Balance.get(getHash(`${event.params.order_seller.payload.bits}-${event.srcAddress}`)),
        buyer_balance: await context.Balance.get(getHash(`${event.params.order_buyer.payload.bits}-${event.srcAddress}`)),

        // Fetch both the buy and sell orders using their respective order IDs
        sell_order: await context.Order.get(event.params.base_sell_order_id),
        buy_order: await context.Order.get(event.params.base_buy_order_id)
      }
    },

    // Handler function that processes the trade event and updates orders and balances
    handler: async ({
      event,
      context,
      loaderReturn
    }) => {

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
      const buy_order = loaderReturn.buy_order;
      const sell_order = loaderReturn.sell_order;

      // Retrieve the balances for both the seller and the buyer from the loader's return value
      const seller_balance = loaderReturn.seller_balance;
      const buyer_balance = loaderReturn.buyer_balance;

      // Process the buy order, reducing the amount by the trade size and updating its status
      if (buy_order) {
        const updatedBuyAmount = buy_order.amount - event.params.trade_size;
        const isBuyOrderClosed = updatedBuyAmount === 0n;

        // Update the buy order status to "Closed" if fully executed, otherwise "Active"
        const updatedBuyOrder: Order = {
          ...buy_order,
          amount: updatedBuyAmount,
          status: isBuyOrderClosed ? "Closed" : "Active",
          timestamp: getISOTime(event.block.time),
        };
        context.Order.set(updatedBuyOrder);

        // Remove the buy order from active orders if fully executed
        if (isBuyOrderClosed) {
          context.ActiveBuyOrder.deleteUnsafe(buy_order.id);
        } else {
          context.ActiveBuyOrder.set(updatedBuyOrder);
        }
      } else {
        context.log.error(`Cannot find buy order ${event.params.base_buy_order_id}`);
      }

      // Process the sell order similarly, updating its amount and status
      if (sell_order) {
        const updatedSellAmount = sell_order.amount - event.params.trade_size;
        const isSellOrderClosed = updatedSellAmount === 0n;

        // Update the sell order status to "Closed" if fully executed, otherwise "Active"
        const updatedSellOrder: Order = {
          ...sell_order,
          amount: updatedSellAmount,
          status: isSellOrderClosed ? "Closed" : "Active",
          timestamp: getISOTime(event.block.time),
        };
        context.Order.set(updatedSellOrder);

        // Remove the sell order from active orders if fully executed
        if (isSellOrderClosed) {
          context.ActiveSellOrder.deleteUnsafe(sell_order.id);
        } else {
          context.ActiveSellOrder.set(updatedSellOrder);
        }
      } else {
        context.log.error(`Cannot find sell order ${event.params.base_sell_order_id}`);
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
        context.log.error(`Cannot find buyer balance ${getHash(`${event.params.order_buyer.payload.bits}-${event.srcAddress}`)}`);
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
        context.log.error(`Cannot find seller balance ${getHash(`${event.params.order_seller.payload.bits}-${event.srcAddress}`)}`);
      }
    }
  }
)