import { balance } from './../../generated/src/Types.gen';
import {
  TradeOrderEvent,
  Order,
  OrderBook
} from "generated";
import { getISOTime } from "../utils/getISOTime";
import { nanoid } from "nanoid";

OrderBook.TradeOrderEvent.handlerWithLoader(
  {
    loader: async ({
      event,
      context,
    }) => {
      return {
        seller_balance: await context.Balance.get(event.params.order_seller.payload.bits),
        buyer_balance: await context.Balance.get(event.params.order_buyer.payload.bits),
        sell_order: await context.Order.get(event.params.base_sell_order_id),
        buy_order: await context.Order.get(event.params.base_buy_order_id)
      }
    },

    handler: async ({
      event,
      context,
      loaderReturn
    }) => {

      const tradeOrderEvent: TradeOrderEvent = {
        id: nanoid(),
        base_sell_order_id: event.params.base_sell_order_id,
        base_buy_order_id: event.params.base_buy_order_id,
        trade_size: event.params.trade_size,
        trade_price: event.params.trade_price,
        seller: event.params.order_seller.payload.bits,
        buyer: event.params.order_buyer.payload.bits,
        seller_base_amount: event.params.s_account_liquid_base,
        seller_quote_amount: event.params.s_account_liquid_quote,
        buyer_base_amount: event.params.b_account_liquid_base,
        buyer_quote_amount: event.params.b_account_liquid_quote,
        tx_id: event.transaction.id,
        timestamp: getISOTime(event.block.time),
      };

      context.TradeOrderEvent.set(tradeOrderEvent);

      const buy_order = loaderReturn.buy_order;
      const sell_order = loaderReturn.sell_order;

      if (!buy_order || !sell_order) {
        context.log.error(`Cannot find orders: buy_order_id: ${event.params.base_buy_order_id}, sell_order_id: ${event.params.base_sell_order_id}`);
        return;
      }

      const updatedBuyAmount = buy_order.amount - event.params.trade_size;
      const isBuyOrderClosed = updatedBuyAmount === 0n;

      const updatedBuyOrder: Order = {
        ...buy_order,
        amount: updatedBuyAmount,
        status: isBuyOrderClosed ? "Closed" : "Active",
        timestamp: getISOTime(event.block.time),
      };

      const updatedSellAmount = sell_order.amount - event.params.trade_size;
      const isSellOrderClosed = updatedSellAmount === 0n;

      const updatedSellOrder: Order = {
        ...sell_order,
        amount: updatedSellAmount,
        status: isSellOrderClosed ? "Closed" : "Active",
        timestamp: getISOTime(event.block.time),
      };

      context.Order.set(updatedBuyOrder);
      context.Order.set(updatedSellOrder);

      if (isBuyOrderClosed) {
        context.ActiveBuyOrder.deleteUnsafe(buy_order.id);
      } else {
        context.ActiveBuyOrder.set(updatedBuyOrder);
      }

      if (isSellOrderClosed) {
        context.ActiveSellOrder.deleteUnsafe(sell_order.id);
      } else {
        context.ActiveSellOrder.set(updatedSellOrder);
      }
      const seller_balance = loaderReturn.seller_balance;
      const buyer_balance = loaderReturn.buyer_balance;

      if (!seller_balance || !buyer_balance) {
        context.log.error(`Cannot find balances: seller: ${event.params.order_seller.payload.bits}, buyer: ${event.params.order_buyer.payload.bits}`);
        return;
      }

      const updatedSellerBalance = {
        ...seller_balance,
        base_amount: event.params.s_account_liquid_base,
        quote_amount: event.params.s_account_liquid_quote,
        timestamp: getISOTime(event.block.time),
      };

      context.Balance.set(updatedSellerBalance);

      const updatedBuyerBalance = {
        ...buyer_balance,
        base_amount: event.params.b_account_liquid_base,
        quote_amount: event.params.b_account_liquid_quote,
        timestamp: getISOTime(event.block.time),
      };

      context.Balance.set(updatedBuyerBalance);
    }
  }
)