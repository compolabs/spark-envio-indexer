import {
  MatchOrderEventEntity,
  OrderBookContract_MatchOrderEventEvent_eventArgs,
  OrderBookContract_MatchOrderEventEvent_handlerContext,
  OrderEntity,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

export const matchOrderEventHandler = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_MatchOrderEventEvent_eventArgs,
  OrderBookContract_MatchOrderEventEvent_handlerContext
>) => {
  const matchOrderEvent: MatchOrderEventEntity = {
    id: nanoid(),
    order_id: event.data.order_id,
    tx_id: event.transactionId,
    asset: event.data.asset.bits,
    order_matcher: event.data.order_matcher.payload.bits,
    owner: event.data.owner.payload.bits,
    counterparty: event.data.counterparty.payload.bits,
    match_size: event.data.match_size,
    match_price: event.data.match_price,
    timestamp: getISOTime(event.time),
  };
  context.MatchOrderEvent.set(matchOrderEvent);

  const order = context.Order.get(event.data.order_id);

  if (!order) {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
    return;
  }

  const amount = order.amount - event.data.match_size;
  const isClosed = amount === 0n;
  const updatedOrder: OrderEntity = {
    ...order,
    amount,
    status: isClosed ? "Closed" : "Active",
    timestamp: getISOTime(event.time),
  };
  context.Order.set(updatedOrder);

  if (isClosed) {
    if (order.order_type === "Buy") {
      context.ActiveBuyOrder.deleteUnsafe(order.id);
    } else if (order.order_type === "Sell") {
      context.ActiveSellOrder.deleteUnsafe(order.id);
    }
  } else {
    if (order.order_type === "Buy") {
      context.ActiveBuyOrder.set(updatedOrder);
    } else if (order.order_type === "Sell") {
      context.ActiveSellOrder.set(updatedOrder);
    }
  }
};
