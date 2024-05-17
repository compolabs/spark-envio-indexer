import { OrderBookContract, spotOrderEntity } from "generated";
import { nanoid } from "nanoid";

function tai64ToDate(tai64: bigint) {
  const dateStr = (
    (tai64 - BigInt(Math.pow(2, 62)) - BigInt(10)) *
    1000n
  ).toString();
  return new Date(+dateStr).toUTCString();
}

function decodeI64(i64: {
  readonly value: bigint;
  readonly negative: boolean;
}) {
  return (i64.negative ? "-" : "") + i64.value.toString();
}

OrderBookContract.MarketCreateEvent.loader(({ event, context }) => {});

OrderBookContract.MarketCreateEvent.handler(({ event, context }) => {
  context.SpotMarketCreateEvent.set({
    id: nanoid(),
    asset_decimals: event.data.asset_decimals,
    asset_id: event.data.asset_id.value,
    timestamp: tai64ToDate(event.data.timestamp),
  });
});

OrderBookContract.OrderChangeEvent.loader(({ event, context }) => {});

OrderBookContract.OrderChangeEvent.handler(({ event, context }) => {
  const eventOrder = event.data.order;
  const timestamp = tai64ToDate(event.data.timestamp);
  const order: spotOrderEntity | null = eventOrder
    ? {
        id: eventOrder.id,
        trader: eventOrder.trader.value,
        base_token: eventOrder.base_token.value,
        base_size: decodeI64(eventOrder.base_size),
        base_price: eventOrder.base_price,
        timestamp,
      }
    : null;

  context.SpotOrderChangeEvent.set({
    id: nanoid(),
    order_id: event.data.order_id,
    new_base_size: order ? order.base_size : "0",
    timestamp,
  });
  if (order) {
    context.SpotOrder.set(order);
  }
});
