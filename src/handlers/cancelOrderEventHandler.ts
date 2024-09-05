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
import { getHash } from "../utils/getHash";

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
    user: event.data.user.payload.bits,
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

  const price_decimals = 1000000000n;
  const quote_decimals = 1000000n;
  const base_decimals = 100000000n;

  if (order.order_type === "Buy") {
    context.ActiveBuyOrder.deleteUnsafe(order.id);

    const balanceId = getHash(
      `0x336b7c06352a4b736ff6f688ba6885788b3df16e136e95310ade51aa32dc6f05-${event.data.user}`
    );
    const balance = context.Balance.get(balanceId)
    if (!balance) {
      context.log.error(
        `Cannot find a balance buy; user:${order.user}; asset: ${order.asset}; id: ${balanceId}`
      );
      return;
    };

    const amount = balance.amount + order.amount * order.price * quote_decimals / price_decimals / base_decimals;
    context.Balance.set({ ...balance, amount });

  } else if (order.order_type === "Sell") {
    context.ActiveSellOrder.deleteUnsafe(order.id);

    const balanceId = getHash(
      `${order.asset}-${order.user}`
    );
    const balance = context.Balance.get(balanceId)

    if (!balance) {
      context.log.error(
        `Cannot find a balance sell; user:${order.user}; asset: ${order.asset}; id: ${balanceId}`
      );
      return;
    };

    const amount = balance.amount + order.amount;
    context.Balance.set({ ...balance, amount });

  }
};
