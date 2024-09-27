import {
  OpenOrderEvent,
  OrderBook_OpenOrderEventEvent_eventArgs,
  OrderBook_OpenOrderEventEvent_handlerContextAsync,
  Order,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

export const openOrderEventHandler = async({
  event,
  context,
}: handlerArgs<
  OrderBook_OpenOrderEventEvent_eventArgs,
  OrderBook_OpenOrderEventEvent_handlerContextAsync
>) => {
  const orderType = event.data.order_type.case;

  const openOrderEvent: OpenOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
    asset: event.data.asset.bits,
    amount: event.data.amount,
    order_type: orderType,
    price: event.data.price,
    user: event.data.user.payload.bits,
    base_amount: event.data.liquid_base,
    quote_amount: event.data.liquid_quote,
    tx_id: event.transactionId,
    timestamp: getISOTime(event.time),
  };
  context.OpenOrderEvent.set(openOrderEvent);

  const order: Order = {
    ...openOrderEvent,
    id: event.data.order_id,
    initial_amount: event.data.amount,
    status: "Active",
  };
  context.Order.set(order);

  if (orderType === "Buy") {
    context.ActiveBuyOrder.set(order);
  } else if (orderType === "Sell") {
    context.ActiveSellOrder.set(order);
  }

  const balance = await context.Balance.get(event.data.user.payload.bits);
  if (!balance) {
    return
  }
  const updatedBalance = {
    ...balance,
    base_amount: event.data.liquid_base,
    quote_amount: event.data.liquid_quote,
    timestamp: getISOTime(event.time),
  };

  context.Balance.set(updatedBalance);

};
