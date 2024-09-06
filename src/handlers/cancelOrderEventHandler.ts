import {
  CancelOrderEvent,
  OrderBook_CancelOrderEventEvent_eventArgs,
  OrderBook_CancelOrderEventEvent_handlerContextAsync,
  Order,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { orderStatus } from "generated/src/Enums.gen";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET, BASE_DECIMAL, QUOTE_DECIMAL, PRICE_DECIMAL } from "../utils/marketConfig";

export const cancelOrderEventHandler = async ({
  event,
  context,
}: handlerArgs<
  OrderBook_CancelOrderEventEvent_eventArgs,
  OrderBook_CancelOrderEventEvent_handlerContextAsync
>) => {
  const cancelOrderEvent: CancelOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
    user: event.data.user.payload.bits,
    tx_id: event.transactionId,
    timestamp: getISOTime(event.time),
  };
  context.CancelOrderEvent.set(cancelOrderEvent);

  const order = await context.Order.get(event.data.order_id);

  if (!order) {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
    return;
  }

  const updatedOrder: Order = {
    ...order,
    amount: 0n,
    status: "Canceled" as orderStatus,
    timestamp: getISOTime(event.time),
  };
  context.Order.set(updatedOrder);

  if (order.order_type === "Buy") {
    const quoteBalanceId = getHash(
      `${QUOTE_ASSET}-${event.data.user.payload.bits}`
    );
    let quoteBalance = await context.Balance.get(quoteBalanceId);

    if (!quoteBalance) {
      context.log.error(
        `Cannot find a quote balance; user:${order.user}; asset: ${QUOTE_ASSET}; id: ${quoteBalanceId}`
      );
      return;
    }

    const amountToReturn = order.amount * order.price * BigInt(QUOTE_DECIMAL) / BigInt(PRICE_DECIMAL) / BigInt(BASE_DECIMAL);

    const updatedQuoteBalance = {
      ...quoteBalance,
      amount: quoteBalance.amount + amountToReturn,
    };
    context.Balance.set(updatedQuoteBalance);

  } else if (order.order_type === "Sell") {
    const baseBalanceId = getHash(
      `${BASE_ASSET}-${event.data.user.payload.bits}`
    );
    let baseBalance = await context.Balance.get(baseBalanceId);

    if (!baseBalance) {
      context.log.error(
        `Cannot find a base balance; user:${order.user}; asset: ${BASE_ASSET}; id: ${baseBalanceId}`
      );
      return;
    }

    const updatedBaseBalance = {
      ...baseBalance,
      amount: baseBalance.amount + order.amount,
    };
    context.Balance.set(updatedBaseBalance);
  }
};
