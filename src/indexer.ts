import { ApolloServer } from "apollo-server-express";
import express from "express";
import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import http from "http";
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "path";
import resolversModule from "./resolvers";

const typeDefs = loadSchemaSync(path.join(__dirname, "../schema.graphql"), {
  loaders: [new GraphQLFileLoader()]
});

const app = express();
const httpServer = http.createServer(app);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: resolversModule.resolvers,
});

const startServer = async () => {
  const server = new ApolloServer({
    schema,
    context: () => ({ pubsub: resolversModule.pubsub }),
  });

  await server.start();
  server.applyMiddleware({ app });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer({ schema }, wsServer);

  app.use(express.static(path.join(__dirname, "../")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
  });

  httpServer.listen({ port: 4000 }, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:4000/graphql`);
  });
};

startServer();
