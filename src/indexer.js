const { ApolloServer } = require("apollo-server-express")
const express = require("express")
const { importSchema } = require("graphql-import")
const { resolvers, pubsub } = require("./resolvers").default
const http = require("http")
const { SubscriptionServer } = require("subscriptions-transport-ws")
const { execute, subscribe } = require("graphql")
const { makeExecutableSchema } = require("@graphql-tools/schema")
const path = require("path")

const typeDefs = importSchema(path.join(__dirname, "../schema.graphql"))

const app = express()
const httpServer = http.createServer(app)

const schema = makeExecutableSchema({ typeDefs, resolvers })

const server = new ApolloServer({
  schema,
  context: () => ({ pubsub }),
})

server.applyMiddleware({ app })

SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
  },
  {
    server: httpServer,
    path: server.graphqlPath,
  }
)

app.use(express.static(path.join(__dirname, "../")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"))
})

httpServer.listen({ port: 4000 }, () => {
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  console.log(
    `🚀 Subscriptions ready at ws://localhost:4000${server.graphqlPath}`
  )
})
