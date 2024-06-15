import { OrderBookContract, spotOrderEntity } from "generated";
import crypto from 'crypto';

function tai64ToDate(tai64: bigint) {
  const dateStr = (
    (tai64 - BigInt(Math.pow(2, 62)) - BigInt(10)) *
    1000n
  ).toString();
  return new Date(+dateStr).toISOString();
}

function decodeI64(i64: {
  readonly value: bigint;
  readonly negative: boolean;
}) {
  return (i64.negative ? "-" : "") + i64.value.toString();
}

OrderBookContract.CancelOrderEvent.loader(({ event, context }) => { });

OrderBookContract.CancelOrderEvent.handler(({ event, context }) => {
  const idSource = `${event.data.order_id}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.CancelOrderEvent.set({
    id: id,
    order_id: event.data.order_id,
  });
});

// Новый обработчик для DepositEvent
OrderBookContract.DepositEvent.loader(({ event, context }) => { });

OrderBookContract.DepositEvent.handler(({ event, context }) => {
  const idSource = `${event.data.amount}-${event.data.asset}-${event.data.trader.bits}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.DepositEvent.set({
    id: id,
    amount: event.data.amount,
    asset: event.data.asset,
    trader: event.data.trader.bits,
  });
});

// Новый обработчик для OpenOrderEvent
OrderBookContract.OpenOrderEvent.loader(({ event, context }) => { });

OrderBookContract.OpenOrderEvent.handler(({ event, context }) => {
  const idSource = `${event.data.amount}-${event.data.asset}-${event.data.asset_type}-${event.data.order_type}-${event.data.order_id}-${event.data.price}-${event.data.trader.bits}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.OpenOrderEvent.set({
    id: id,
    amount: event.data.amount,
    asset: event.data.asset,
    asset_type: event.data.asset_type,
    order_type: event.data.order_type,
    order_id: event.data.order_id,
    price: event.data.price,
    trader: event.data.trader.bits,
  });
});

// Новый обработчик для SetFeeEvent
OrderBookContract.SetFeeEvent.loader(({ event, context }) => { });

OrderBookContract.SetFeeEvent.handler(({ event, context }) => {
  const idSource = `${event.data.amount}-${event.data.trader ? event.data.trader.bits : 'null'}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.SetFeeEvent.set({
    id: id,
    amount: event.data.amount,
    trader: event.data.trader ? event.data.trader.bits : null,
  });
});

// Новый обработчик для MatchOrderEvent
OrderBookContract.MatchOrderEvent.loader(({ event, context }) => { });

OrderBookContract.MatchOrderEvent.handler(({ event, context }) => {
  const idSource = `${event.data.amount}-${event.data.asset}-${event.data.trader ? event.data.trader.bits : 'null'}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.MatchOrderEvent.set({
    id: id,
    amount: event.data.amount,
    asset: event.data.asset,
    trader: event.data.trader ? event.data.trader.bits : null,
  });
});

OrderBookContract.WithdrawEvent.loader(({ event, context }) => { });

OrderBookContract.WithdrawEvent.handler(({ event, context }) => {
  const idSource = `${event.data.amount}-${event.data.asset}-${event.data.trader ? event.data.trader.bits : 'null'}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.WithdrawEvent.set({
    id: id,
    amount: event.data.amount,
    asset: event.data.asset,
    trader: event.data.trader ? event.data.trader.bits : null,
  });
});