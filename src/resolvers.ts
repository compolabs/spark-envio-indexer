import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();
export const activeOrders = new Set();

export const resolvers = {
  Subscription: {
    activeOrders: {
      subscribe: () => pubsub.asyncIterator(['ACTIVE_ORDERS']),
      resolve: () => ({ id: 'activeOrdersCollection', orders: Array.from(activeOrders) }),
    },
  },
};
