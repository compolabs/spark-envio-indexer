import { OrderBookContract } from "generated";
import { orderStatus } from "generated/src/Enums.gen";
import { nanoid } from "nanoid";
import crypto from "crypto";
import resolversModule from "./resolvers";
const pubsub = resolversModule.pubsub;

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
OrderBookContract.OpenOrderEvent.loader(({ event, context }) => {});
OrderBookContract.OpenOrderEvent.handler(({ event, context }) => {
  const openOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
    tx_id: event.transactionId,
    asset: event.data.asset.bits,
    amount: event.data.amount,
    asset_type: event.data.asset_type.case,
    order_type: event.data.order_type.case,
    price: event.data.price,
    user: event.data.user.payload.bits,
    timestamp: new Date(event.time * 1000).toISOString(),
  };
  context.OpenOrderEvent.set(openOrderEvent);

  let order = {
    ...openOrderEvent,
    id: event.data.order_id,
    initial_amount: event.data.amount,
    status: "Active" as orderStatus,
  };
  context.Order.set(order);
  context.ActiveOrder.set(order);
  pubsub.publish("ORDER_UPDATED", { orderUpdated: order });
});

/* 
pub struct CancelOrderEvent {
  pub order_id: b256,
}
*/
OrderBookContract.CancelOrderEvent.loader(({ event, context }) => {
  context.Order.load(event.data.order_id);
});
OrderBookContract.CancelOrderEvent.handler(({ event, context }) => {
  const cancelOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
    tx_id: event.transactionId,
    timestamp: new Date(event.time * 1000).toISOString(),
  };

  context.CancelOrderEvent.set(cancelOrderEvent);

  let order = context.Order.get(event.data.order_id);
  if (order != null) {
    const updatedOrder = {
      ...order,
      amount: 0n,
      status: "Canceled" as orderStatus,
      timestamp: new Date(event.time * 1000).toISOString(),
    };
    context.Order.set(updatedOrder);
    context.ActiveOrder.deleteUnsafe(event.data.order_id);

    // Publish the update
    pubsub.publish("ORDER_UPDATED", { orderUpdated: updatedOrder });
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
OrderBookContract.MatchOrderEvent.loader(({ event, context }) => {
  context.Order.load(event.data.order_id);
});
OrderBookContract.MatchOrderEvent.handler(({ event, context }) => {
  const matchOrderEvent = {
    id: nanoid(),
    order_id: event.data.order_id,
    tx_id: event.transactionId,
    asset: event.data.asset.bits,
    order_matcher: event.data.order_matcher.payload.bits,
    owner: event.data.owner.payload.bits,
    counterparty: event.data.counterparty.payload.bits,
    match_size: event.data.match_size,
    match_price: event.data.match_price,
    timestamp: new Date(event.time * 1000).toISOString(),
  };
  context.MatchOrderEvent.set(matchOrderEvent);

  let order = context.Order.get(event.data.order_id);
  if (order != null) {
    const amount = order.amount - event.data.match_size;
    const updatedOrder = {
      ...order,
      amount,
      status: (amount == 0n ? "Closed" : "Active") as orderStatus,
      timestamp: new Date(event.time * 1000).toISOString(),
    };
    context.Order.set(updatedOrder);
    if (amount == 0n) {
      context.ActiveOrder.deleteUnsafe(event.data.order_id);
    }
    // Publish the update
    pubsub.publish("ORDER_UPDATED", { orderUpdated: updatedOrder });
  } else {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
  }
});

// pub struct TradeOrderEvent {
//     pub base_sell_order_id: b256,
//     pub base_buy_order_id: b256,
//     pub order_matcher: Identity,
//     pub trade_size: u64,
//     pub trade_price: u64,
//     pub block_height: u32,
//     pub tx_id: b256,
// }

OrderBookContract.TradeOrderEvent.loader(({ event, context }) => {});
OrderBookContract.TradeOrderEvent.handler(({ event, context }) => {
  const idSource = `${event.data.order_matcher}-${event.data.trade_size}-${event.data.trade_price}-${event.data.base_sell_order_id}-${event.data.base_buy_order_id}-${event.data.tx_id}`;
  const id = crypto.createHash("sha256").update(idSource).digest("hex");
  const tradeOrderEvent = {
    id: id,
    base_sell_order_id: event.data.base_sell_order_id,
    base_buy_order_id: event.data.base_buy_order_id,
    tx_id: event.transactionId,
    order_matcher: event.data.order_matcher.payload.bits,
    trade_size: event.data.trade_size,
    trade_price: event.data.trade_price,
    // block_height: event.data.block_height,
    timestamp: new Date(event.time * 1000).toISOString(),
  };

  context.TradeOrderEvent.set(tradeOrderEvent);
});

/* 
pub struct DepositEvent {
  pub amount: u64,
  pub asset: AssetId,
  pub user: Identity,
}
*/
OrderBookContract.DepositEvent.loader(({ event, context }) => {
  const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
  const id = crypto.createHash("sha256").update(idSource).digest("hex");
  context.Balance.load(id);
});
OrderBookContract.DepositEvent.handler(({ event, context }) => {
  const depositEvent = {
    id: nanoid(),
    tx_id: event.transactionId,
    amount: event.data.amount,
    asset: event.data.asset.bits,
    user: event.data.user.payload.bits,
    timestamp: new Date(event.time * 1000).toISOString(),
  };
  context.DepositEvent.set(depositEvent);

  const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
  const id = crypto.createHash("sha256").update(idSource).digest("hex");
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
OrderBookContract.WithdrawEvent.loader(({ event, context }) => {
  const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
  const id = crypto.createHash("sha256").update(idSource).digest("hex");
  context.Balance.load(id);
});
OrderBookContract.WithdrawEvent.handler(({ event, context }) => {
  const withdrawEvent = {
    id: nanoid(),
    tx_id: event.transactionId,
    amount: event.data.amount,
    asset: event.data.asset.bits,
    user: event.data.user.payload.bits,
    timestamp: new Date(event.time * 1000).toISOString(),
  };
  context.WithdrawEvent.set(withdrawEvent);

  const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
  const id = crypto.createHash("sha256").update(idSource).digest("hex");
  let balance = context.Balance.get(id);
  if (balance != null) {
    const amount = balance.amount - event.data.amount;
    context.Balance.set({ ...balance, amount });
  } else {
    context.log.error(
      `Cannot find a balance; user:${event.data.user}; asset: ${event.data.asset.bits}; id: ${id}`
    );
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
