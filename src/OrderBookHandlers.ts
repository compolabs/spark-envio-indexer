import { OrderBookContract } from "generated";
import { orderStatus } from "generated/src/Enums.gen";
import { nanoid } from "nanoid";
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

/* 
pub struct OpenOrderEvent {
  pub order_id: b256,
  pub asset: AssetId,
  pub amount: u64,
  pub asset_type: AssetType,
  pub order_type: OrderType,
  pub price: u64,
  pub user: Identity,
}
*/
OrderBookContract.OpenOrderEvent.loader(({ event, context }) => { });
OrderBookContract.OpenOrderEvent.handler(({ event, context }) => {
  // ? Этим логом можно пользоваться чтобы узнать какие данные приходят в обработчик
  // context.log.info(event as any)

  // ? Создаем OpenOrderEvent и записываем его в базу данных
  const openOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
    asset: event.data.asset.bits,
    amount: event.data.amount,
    asset_type: event.data.asset_type.case,
    order_type: event.data.order_type.case,
    price: event.data.price,
    user: event.data.user.payload.bits
  };
  context.OpenOrderEvent.set(openOrderEvent);

  // ? Создаем Order и записываем его в базу данных
  let order = {
    ...openOrderEvent,
    id: event.data.order_id,
    initail_amount: event.data.amount,
    status: "Active" as orderStatus
  };
  context.Order.set(order);
});

/* 
pub struct CancelOrderEvent {
  pub order_id: b256,
}
*/
OrderBookContract.CancelOrderEvent.loader(({ event, context }) => { });
OrderBookContract.CancelOrderEvent.handler(({ event, context }) => {
  const cancelOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
  };
  context.CancelOrderEvent.set(cancelOrderEvent);

  let order = context.Order.get(event.data.order_id);
  if (order != null) {
    context.Order.set({ ...order, amount: 0n, status: "Canceled" });
  } else {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
  }
});

/* 
pub struct MatchOrderEvent {
  pub order_id: b256,
  pub asset: AssetId,
  pub order_matcher: Identity,
  pub owner: Identity,
  pub counterparty: Identity,
  pub match_size: u64,
  pub match_price: u64,
}
*/
OrderBookContract.MatchOrderEvent.loader(({ event, context }) => { });
OrderBookContract.MatchOrderEvent.handler(({ event, context }) => {
  const matchOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
    asset: event.data.asset.bits,
    order_matcher: event.data.order_matcher.payload.bits,
    owner: event.data.owner.payload.bits,
    counterparty: event.data.counterparty.payload.bits,
    match_size: event.data.match_size,
    match_price: event.data.match_price,
  };
  context.MatchOrderEvent.set(matchOrderEvent);

  let order = context.Order.get(event.data.order_id);
  if (order != null) {
    const amount = order.amount - event.data.match_size;
    context.Order.set({ ...order, amount, status: amount == 0n ? "Closed" : "Active" });
  } else {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
  }
});

/* 
pub struct DepositEvent {
  pub amount: u64,
  pub asset: AssetId,
  pub user: Identity,
}
*/
OrderBookContract.DepositEvent.loader(({ event, context }) => { });
OrderBookContract.DepositEvent.handler(({ event, context }) => {
  // context.log.info(event as any)
  const depositEvent = {
    id: nanoid(),
    amount: event.data.amount,
    asset: event.data.asset.bits,
    user: event.data.user.payload.bits
  };
  context.DepositEvent.set(depositEvent);

  const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  let balance = context.Balance.get(id);
  if (balance != null) {
    const amount = balance.amount + event.data.amount;
    context.Balance.set({ ...balance, amount });
  } else {
    context.Balance.set({ ...depositEvent, id });
  }
});

/* 
pub struct WithdrawEvent {
  pub amount: u64,
  pub asset: AssetId,
  pub user: Identity,
}
*/
OrderBookContract.WithdrawEvent.loader(({ event, context }) => { });
OrderBookContract.WithdrawEvent.handler(({ event, context }) => {
  // context.log.info(event as any)
  const withdrawEvent = {
    id: nanoid(),
    amount: event.data.amount,
    asset: event.data.asset.bits,
    user: event.data.user.payload.bits
  };
  context.WithdrawEvent.set(withdrawEvent);

  const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  let balance = context.Balance.get(id);
  if (balance != null) {
    const amount = balance.amount - event.data.amount;
    context.Balance.set({ ...balance, amount });
  } else {
    context.log.error(`Cannot find a balance; user:${event.data.user}; asset: ${event.data.asset.bits}; id: ${id}`);
  }
});


/*
pub struct SetFeeEvent {
  pub amount: u64,
  pub user: Option<Identity>,
}
*/
// OrderBookContract.WithdrawEvent.loader(({ event, context }) => { });
// OrderBookContract.WithdrawEvent.handler(({ event, context }) => {});
