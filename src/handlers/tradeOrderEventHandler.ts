import {
  OrderBook_TradeOrderEventEvent_eventArgs,
  OrderBook_TradeOrderEventEvent_handlerContextAsync,
  TradeOrderEvent,
  Order,
  Balance,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, BASE_DECIMAL, PRICE_DECIMAL, QUOTE_ASSET, QUOTE_DECIMAL } from "../utils/marketConfig";

export const tradeOrderEventHandler = async ({
  event,
  context,
}: handlerArgs<
  OrderBook_TradeOrderEventEvent_eventArgs,
  OrderBook_TradeOrderEventEvent_handlerContextAsync
>) => {
  const idSource = getHash(
    `${event.data.trade_size}-${event.data.trade_price}-${event.data.base_sell_order_id}-${event.data.base_buy_order_id}-${event.data.tx_id}`
  );

  const tradeOrderEvent: TradeOrderEvent = {
    id: idSource,
    base_sell_order_id: event.data.base_sell_order_id,
    base_buy_order_id: event.data.base_buy_order_id,
    trade_size: event.data.trade_size,
    trade_price: event.data.trade_price,
    seller: event.data.order_seller.payload.bits,
    buyer: event.data.order_buyer.payload.bits,
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

  const buyerBalanceId = getHash(`${BASE_ASSET}-${event.data.order_buyer.payload.bits}`);
  let buyerBalance = await context.Balance.get(buyerBalanceId);

  if (!buyerBalance) {
    buyerBalance = {
      id: buyerBalanceId,
      user: event.data.order_buyer.payload.bits,
      asset: BASE_ASSET,
      amount: 0n,
      timestamp: getISOTime(event.time),
    } as Balance;
  }

  const updatedBuyerBalance = {
    ...buyerBalance,
    amount: buyerBalance.amount + event.data.trade_size,
  };
  context.Balance.set(updatedBuyerBalance);

  const sellerBalanceId = getHash(`${QUOTE_ASSET}-${event.data.order_seller.payload.bits}`);
  let sellerBalance = await context.Balance.get(sellerBalanceId);

  if (!sellerBalance) {
    sellerBalance = {
      id: sellerBalanceId,
      user: event.data.order_seller.payload.bits,
      asset: QUOTE_ASSET,
      amount: 0n,
      timestamp: getISOTime(event.time),
    } as Balance;
  }

  const quoteAmountReceived = (event.data.trade_size * event.data.trade_price * BigInt(QUOTE_DECIMAL)) / BigInt(PRICE_DECIMAL) / BigInt(BASE_DECIMAL);

  const updatedSellerBalance = {
    ...sellerBalance,
    amount: sellerBalance.amount + quoteAmountReceived,
  };
  context.Balance.set(updatedSellerBalance);

};
