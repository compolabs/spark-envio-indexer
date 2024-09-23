import {
  OrderBook_TradeOrderEvent_eventArgs,
  TradeOrderEvent,
  Order,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getISOTime } from "../utils/getISOTime";
import { nanoid } from "nanoid";

export const tradeOrderEventHandler = async ({
  event,
  context,
}: handlerArgs<
  OrderBook_TradeOrderEvent_eventArgs
>) => {

  const tradeOrderEvent: TradeOrderEvent = {
    id: nanoid(),
    base_sell_order_id: event.data.base_sell_order_id,
    base_buy_order_id: event.data.base_buy_order_id,
    trade_size: event.data.trade_size,
    trade_price: event.data.trade_price,
    seller: event.data.order_seller.payload.bits,
    buyer: event.data.order_buyer.payload.bits,
    seller_base_amount: event.data.s_account_liquid_base,
    seller_quote_amount: event.data.s_account_liquid_quote,
    buyer_base_amount: event.data.b_account_liquid_base,
    buyer_quote_amount: event.data.b_account_liquid_quote,
    tx_id: event.transactionId,
    timestamp: getISOTime(event.time),
  };

  context.TradeOrderEvent.set(tradeOrderEvent);

  const buy_order = await context.Order.get(event.data.base_buy_order_id);
  const sell_order = await context.Order.get(event.data.base_sell_order_id);

  if (!buy_order || !sell_order) {
    context.log.error(`Cannot find orders: buy_order_id: ${event.data.base_buy_order_id}, sell_order_id: ${event.data.base_sell_order_id}`);
    return;
  }

  const updatedBuyAmount = buy_order.amount - event.data.trade_size;
  const isBuyOrderClosed = updatedBuyAmount === 0n;

  const updatedBuyOrder: Order = {
    ...buy_order,
    amount: updatedBuyAmount,
    status: isBuyOrderClosed ? "Closed" : "Active",
    timestamp: getISOTime(event.time),
  };

  const updatedSellAmount = sell_order.amount - event.data.trade_size;
  const isSellOrderClosed = updatedSellAmount === 0n;

  const updatedSellOrder: Order = {
    ...sell_order,
    amount: updatedSellAmount,
    status: isSellOrderClosed ? "Closed" : "Active",
    timestamp: getISOTime(event.time),
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

  const seller_balance = await context.Balance.get(event.data.order_seller.payload.bits);
  const buyer_balance = await context.Balance.get(event.data.order_buyer.payload.bits);

  if (!seller_balance || !buyer_balance) {
    return;
  }

  const updatedSellerBalance = {
    ...seller_balance,
    base_amount: event.data.s_account_liquid_base,
    quote_amount: event.data.s_account_liquid_quote,
    timestamp: getISOTime(event.time),
  };

  context.Balance.set(updatedSellerBalance);

  const updatedBuyerBalance = {
    ...buyer_balance,
    base_amount: event.data.b_account_liquid_base,
    quote_amount: event.data.b_account_liquid_quote,
    timestamp: getISOTime(event.time),
  };

  context.Balance.set(updatedBuyerBalance);
};
