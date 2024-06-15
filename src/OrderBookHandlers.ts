import crypto from 'crypto';
// Импортируйте правильные контракты и типы из сгенерированных файлов
import { MarketContract } from 'generated';

function tai64ToDate(tai64: bigint): string {
  const dateStr = (
    (tai64 - BigInt(Math.pow(2, 62)) - BigInt(10)) * 1000n
  ).toString();
  return new Date(+dateStr).toISOString();
}

function decodeI64(i64: { readonly value: bigint; readonly negative: boolean }): string {
  return (i64.negative ? "-" : "") + i64.value.toString();
}

// Обработчик для CancelOrderEvent
MarketContract.CancelOrderEvent.loader(({ event, context }: { event: any; context: any }) => { });

MarketContract.CancelOrderEvent.handler(({ event, context }: { event: any; context: any }) => {
  const idSource = `${event.data.order_id}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.CancelOrderEvent.set({
    id: id,
    order_id: event.data.order_id,
  });
});

// Обработчик для DepositEvent
MarketContract.DepositEvent.loader(({ event, context }: { event: any; context: any }) => { });

MarketContract.DepositEvent.handler(({ event, context }: { event: any; context: any }) => {
  const idSource = `${event.data.amount}-${event.data.asset}-${event.data.trader}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.DepositEvent.set({
    id: id,
    amount: event.data.amount,
    asset: event.data.asset,
    trader: event.data.trader ? event.data.trader : null,
  });
});

// Обработчик для OpenOrderEvent
MarketContract.OpenOrderEvent.loader(({ event, context }: { event: any; context: any }) => { });

MarketContract.OpenOrderEvent.handler(({ event, context }: { event: any; context: any }) => {
  const eventOrder = event.data.order;
  const idSource = `${event.data.amount}-${event.data.asset}-${event.data.asset_type.case}-${event.data.order_type.case}-${event.data.order_id}-${event.data.price}-${event.data.trader}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.OpenOrderEvent.set({
    id: id,
    amount: event.data.amount,
    asset: event.data.asset,
    asset_type: event.data.asset_type.case,
    order_type:
      eventOrder.amount.value === 0n
        ? undefined
        : eventOrder.amount.negative
          ? "sell"
          : "buy",
    order_id: event.data.order_id,
    price: event.data.price,
    trader: event.data.trader ? event.data.trader.bits : null,
  });
});

// Обработчик для SetFeeEvent
MarketContract.SetFeeEvent.loader(({ event, context }: { event: any; context: any }) => { });

MarketContract.SetFeeEvent.handler(({ event, context }: { event: any; context: any }) => {
  const idSource = `${event.data.amount}-${event.data.trader ? event.data.trader.bits : 'null'}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.SetFeeEvent.set({
    id: id,
    amount: event.data.amount,
    trader: event.data.trader ? event.data.trader.bits : null,
  });
});

// Обработчик для MatchOrderEvent
MarketContract.MatchOrderEvent.loader(({ event, context }: { event: any; context: any }) => { });

MarketContract.MatchOrderEvent.handler(({ event, context }: { event: any; context: any }) => {
  const idSource = `${event.data.order_id}-${event.data.asset}-${event.data.order_matcher.bits}-${event.data.owner.bits}-${event.data.counterparty.bits}-${event.data.match_size}-${event.data.match_price}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.MatchOrderEvent.set({
    id: id,
    order_id: event.data.order_id,
    asset: event.data.asset,
    order_matcher: event.data.order_matcher.bits,
    owner: event.data.owner.bits,
    counterparty: event.data.counterparty.bits,
    match_size: event.data.match_size,
    match_price: event.data.match_price,
  });
});

// Обработчик для WithdrawEvent
MarketContract.WithdrawEvent.loader(({ event, context }: { event: any; context: any }) => { });

MarketContract.WithdrawEvent.handler(({ event, context }: { event: any; context: any }) => {
  const idSource = `${event.data.amount}-${event.data.asset}-${event.data.trader ? event.data.trader.bits : 'null'}-${event.transactionId}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  context.WithdrawEvent.set({
    id: id,
    amount: event.data.amount,
    asset: event.data.asset,
    trader: event.data.trader ? event.data.trader.bits : null,
  });
});
