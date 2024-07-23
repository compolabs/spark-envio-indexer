import { PubSub } from 'graphql-subscriptions';
export const pubsub = new PubSub();

export const activeOrders = new Set(); // Пример хранения активных ордеров

export const resolvers = {
  Subscription: {
    orderUpdated: {
      subscribe: () => pubsub.asyncIterator(['ORDER_UPDATED']),
    },
    activeOrders: {
      subscribe: () => pubsub.asyncIterator(['ACTIVE_ORDERS']),
      resolve: () => ({ id: 'activeOrdersCollection', order_ids: Array.from(activeOrders) }),
    },
  },
};

module.exports = { resolvers, pubsub, activeOrders };
