import {
  CancelOrderEventEntity,
  OrderBookContract_CancelOrderEventEvent_eventArgs,
  OrderBookContract_CancelOrderEventEvent_handlerContext,
  OrderEntity,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { orderStatus } from "generated/src/Enums.gen";
import { getISOTime } from "../utils/getISOTime";

export const cancelOrderEventHandler = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_CancelOrderEventEvent_eventArgs,
  OrderBookContract_CancelOrderEventEvent_handlerContext
>) => {
  const cancelOrderEvent: CancelOrderEventEntity = {
    id: nanoid(),
    order_id: event.data.order_id,
    tx_id: event.transactionId,
    timestamp: getISOTime(event.time),
  };
  context.CancelOrderEvent.set(cancelOrderEvent);

  const order = context.Order.get(event.data.order_id);

  if (!order) {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
    return;
  }

  const updatedOrder: OrderEntity = {
    ...order,
    amount: 0n,
    status: "Canceled" as orderStatus,
    timestamp: getISOTime(event.time),
  };
  context.Order.set(updatedOrder);

  if (order.order_type === "Buy") {
    context.ActiveBuyOrder.deleteUnsafe(order.id);
  } else if (order.order_type === "Sell") {
    context.ActiveSellOrder.deleteUnsafe(order.id);
  }
};
