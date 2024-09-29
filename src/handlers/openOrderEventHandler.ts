import {
  OpenOrderEventEntity,
  OrderBookContract_OpenOrderEventEvent_eventArgs,
  OrderBookContract_OpenOrderEventEvent_handlerContext,
  OrderEntity,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET, BASE_DECIMAL, QUOTE_DECIMAL, PRICE_DECIMAL } from "../utils/marketConfig";

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
    const balanceId = getHash(`${QUOTE_ASSET}-${event.data.user.payload.bits}`);
    const balance = context.Balance.get(balanceId);

    if (!balance) {
      context.log.error(
        `Cannot find a balance; user:${event.data.user.payload.bits}; asset: ${QUOTE_ASSET}; id: ${balanceId}`
      );
      return;
    }

    const updatedAmount = balance.amount - (event.data.amount * event.data.price * BigInt(QUOTE_DECIMAL)) / BigInt(BASE_DECIMAL) / BigInt(PRICE_DECIMAL);

    context.Balance.set({ ...balance, amount: updatedAmount });
    context.ActiveBuyOrder.set(order);

  } else if (orderType === "Sell") {
    const balanceId = getHash(`${BASE_ASSET}-${event.data.user.payload.bits}`);
    const balance = context.Balance.get(balanceId);

    if (!balance) {
      context.log.error(
        `Cannot find a balance; user:${event.data.user.payload.bits}; asset: ${BASE_ASSET}; id: ${balanceId}`
      );
      return;
    }

    const updatedAmount = balance.amount - event.data.amount;

    context.Balance.set({ ...balance, amount: updatedAmount });
    context.ActiveSellOrder.set(order);
  }
};