import {
  OpenOrderEventEntity,
  OrderBookContract_OpenOrderEventEvent_eventArgs,
  OrderBookContract_OpenOrderEventEvent_handlerContext,
  OrderEntity,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

export const openOrderEventHandler = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_OpenOrderEventEvent_eventArgs,
  OrderBookContract_OpenOrderEventEvent_handlerContext
>) => {
  const orderType = event.data.order_type.case;

  const openOrderEvent: OpenOrderEventEntity = {
    id: nanoid(),
    order_id: event.data.order_id,
    tx_id: event.transactionId,
    asset: event.data.asset.bits,
    amount: event.data.amount,
    order_type: orderType,
    price: event.data.price,
    user: event.data.user.payload.bits,
    timestamp: getISOTime(event.time),
  };
  context.OpenOrderEvent.set(openOrderEvent);

  const order: OrderEntity = {
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
};
