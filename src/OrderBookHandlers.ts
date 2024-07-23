import { OrderBookContract } from "generated";
import { orderStatus } from "generated/src/Enums.gen";
import { nanoid } from "nanoid";
import crypto from 'crypto';
import { pubsub, activeOrders } from './resolvers';

OrderBookContract.OpenOrderEvent.loader(({ event, context }) => {
  context.Order.load(event.data.order_id);
});

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
    status: "Active" as orderStatus
  };
  context.Order.set(order);
  activeOrders.add(order.id); // Добавляем ордер в Set
  console.log("Active Orders after OpenOrderEvent:", Array.from(activeOrders));
  pubsub.publish('ORDER_UPDATED', { orderUpdated: order });
  pubsub.publish('ACTIVE_ORDERS', { activeOrders: { id: 'activeOrdersCollection', order_ids: Array.from(activeOrders) } });
});

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
    const updatedOrder = { ...order, amount: 0n, status: "Canceled" as orderStatus, timestamp: new Date(event.time * 1000).toISOString() };
    context.Order.set(updatedOrder);
    activeOrders.delete(order.id); // Удаляем ордер из Set
    console.log("Active Orders after CancelOrderEvent:", Array.from(activeOrders));
    pubsub.publish('ORDER_UPDATED', { orderUpdated: updatedOrder });
    pubsub.publish('ACTIVE_ORDERS', { activeOrders: { id: 'activeOrdersCollection', order_ids: Array.from(activeOrders) } });
  } else {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
  }
});

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
    const updatedOrder = { ...order, amount, status: (amount == 0n ? "Closed" : "Active") as orderStatus, timestamp: new Date(event.time * 1000).toISOString() };
    context.Order.set(updatedOrder);
    if (updatedOrder.status === "Active") {
      activeOrders.add(order.id);
    } else {
      activeOrders.delete(order.id);
    }
    console.log("Active Orders after MatchOrderEvent:", Array.from(activeOrders));
    pubsub.publish('ORDER_UPDATED', { orderUpdated: updatedOrder });
    pubsub.publish('ACTIVE_ORDERS', { activeOrders: { id: 'activeOrdersCollection', order_ids: Array.from(activeOrders) } });
  } else {
    context.log.error(`Cannot find an order ${event.data.order_id}`);
  }
});

OrderBookContract.TradeOrderEvent.loader(({ event, context }) => { });

OrderBookContract.TradeOrderEvent.handler(({ event, context }) => {
  const idSource = `${event.data.order_matcher}-${event.data.trade_size}-${event.data.trade_price}-${event.data.base_sell_order_id}-${event.data.base_buy_order_id}-${event.data.tx_id}`;
  const id = crypto.createHash('sha256').update(idSource).digest('hex');
  const tradeOrderEvent = {
    id: id,
    base_sell_order_id: event.data.base_sell_order_id,
    base_buy_order_id: event.data.base_buy_order_id,
    tx_id: event.transactionId,
    order_matcher: event.data.order_matcher.payload.bits,
    trade_size: event.data.trade_size,
    trade_price: event.data.trade_price,
    timestamp: new Date(event.time * 1000).toISOString(),
  };

  context.TradeOrderEvent.set(tradeOrderEvent);
});





// OrderBookContract.DepositEvent.loader(({ event, context }) => {
//   const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
//   const id = crypto.createHash('sha256').update(idSource).digest('hex');
//   context.Balance.load(id);
// });
// OrderBookContract.DepositEvent.handler(({ event, context }) => {
//   const depositEvent = {
//     id: nanoid(),
//     tx_id: event.transactionId,
//     amount: event.data.amount,
//     asset: event.data.asset.bits,
//     user: event.data.user.payload.bits,
//     timestamp: new Date(event.time * 1000).toISOString(),
//   };
//   context.DepositEvent.set(depositEvent);

//   const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
//   const id = crypto.createHash('sha256').update(idSource).digest('hex');
//   let balance = context.Balance.get(id);
//   if (balance != null) {
//     const amount = balance.amount + event.data.amount;
//     context.Balance.set({ ...balance, amount });
//   } else {
//     context.Balance.set({ ...depositEvent, id });
//   }
// });

// OrderBookContract.WithdrawEvent.loader(({ event, context }) => {
//   const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
//   const id = crypto.createHash('sha256').update(idSource).digest('hex');
//   context.Balance.load(id);
// });
// OrderBookContract.WithdrawEvent.handler(({ event, context }) => {
//   const withdrawEvent = {
//     id: nanoid(),
//     tx_id: event.transactionId,
//     amount: event.data.amount,
//     asset: event.data.asset.bits,
//     user: event.data.user.payload.bits,
//     timestamp: new Date(event.time * 1000).toISOString(),
//   };
//   context.WithdrawEvent.set(withdrawEvent);

//   const idSource = `${event.data.asset.bits}-${event.data.user.payload.bits}`;
//   const id = crypto.createHash('sha256').update(idSource).digest('hex');
//   let balance = context.Balance.get(id);
//   if (balance != null) {
//     const amount = balance.amount - event.data.amount;
//     context.Balance.set({ ...balance, amount });
//   } else {
//     context.log.error(`Cannot find a balance; user:${event.data.user}; asset: ${event.data.asset.bits}; id: ${id}`);
//   }
// });


/*
pub struct SetFeeEvent {
  pub amount: u64,
  pub user: Option<Identity>,
}
*/
// OrderBookContract.WithdrawEvent.loader(({ event, context }) => { });
// OrderBookContract.WithdrawEvent.handler(({ event, context }) => {});
