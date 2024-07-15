import { ApolloServer } from "apollo-server-express"
import express from "express"
import { importSchema } from "graphql-import"
import http from "http"
import { SubscriptionServer } from "subscriptions-transport-ws"
import { execute, subscribe } from "graphql"
import { makeExecutableSchema } from "@graphql-tools/schema"
import path from "path"
import { fileURLToPath } from "url"
import resolversModule from "./resolvers"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const typeDefs = importSchema(path.join(__dirname, "../schema.graphql"))

const app = express()
const httpServer = http.createServer(app)

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: resolversModule.resolvers,
})

const server = new ApolloServer({
  schema,
  context: () => ({ pubsub: resolversModule.pubsub }),
})

await server.start()
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
