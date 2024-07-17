import { PubSub } from "graphql-subscriptions"
const pubsub = new PubSub()

const resolvers = {
  Subscription: {
    orderUpdated: {
      subscribe: () => pubsub.asyncIterator(["ORDER_UPDATED"]),
    },
  },
}

export default { resolvers, pubsub }
