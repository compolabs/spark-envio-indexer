## Spark OrderBook indexer

Contract: https://github.com/compolabs/orderbook-contract/tree/master/market-contract

_Please refer to the [documentation website](https://docs.envio.dev) for a thorough guide on all Envio indexer features_

## Local usage

1. Clone the repository

   ```sh
   git clone git@github.com:enviodev/spark-orderbook-indexer.git
   ```

2. Open it locally

   ```sh
   cd spark-orderbook-indexer
   ```

3. Install dependencies (requires [pnpm@8](https://pnpm.io/))

   ```sh
   pnpm i
   ```

4. Run envio

   ```sh
   pnpm dev
   ```

5. Verify it's working correctly by checking the Hasura:
   1. Open http://localhost:8080
   2. Enter admin-secret `testing`

6. Query the Indexer

```
query MyQuery {
  Order(where: {status: {_eq: "Active"}}) {
    id
    initial_amount
    status
    price
    amount
    order_type
  }
}
```

This query will return a list of orders with the status "Active", including their id, initial_amount, status, price, amount, and order_type.

```
query MyQuery {
  Order(where: {user: {_eq: ""}}) {
    id
    initial_amount
    status
    price
    amount
    order_type
    asset_type
  }
}
```

This query fetches orders filtered by user, returning their id, initial_amount, status, price, amount, order_type, and asset_type.

```
query MyQuery {
  MatchOrderEvent(where: {owner: {_eq: ""}}) {
    id
    asset
    counterparty
    match_price
    match_size
    order_id
    order_matcher
    owner
    timestamp
    tx_id
  }
}
```

This query fetches match order events based on the owner, including details such as id, asset, counterparty, match_price, match_size, order_id, order_matcher, owner, timestamp, and tx_id.

## Using WebSockets in Rust and TypeScript

To interact with the OrderBook Indexer via WebSockets, you can use different libraries and approaches depending on the programming language. Below are examples for Rust and TypeScript.

1. Rust

In Rust, you can use the tokio-tungstenite library for working with WebSockets. This example demonstrates how to establish a connection to the server and send a request.
- Add the dependencies to your Cargo.toml:

```
[dependencies]
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = "0.15"
serde_json = "1.0"

```
- Example code for a WebSocket client in Rust:

```
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::protocol::Message;
use futures_util::{StreamExt, SinkExt};
use serde_json::json;

#[tokio::main]
async fn main() {
    // WebSocket server URL
    let url = "ws://localhost:8080/v1/graphql";

    // Establish the connection
    let (mut ws_stream, _) = connect_async(url).await.expect("Failed to connect");

    println!("WebSocket connected");

    // Create a GraphQL subscription request
    let request = json!({
        "type": "start",
        "id": "1",
        "payload": {
            "query": r#"
                subscription {
                    Order(where: {status: {_eq: "Active"}}) {
                        id
                        initial_amount
                        status
                        price
                        amount
                        order_type
                    }
                }
            "#
        }
    });

    // Send the request to the server
    ws_stream.send(Message::Text(request.to_string())).await.expect("Failed to send message");

    // Listen for responses from the server
    while let Some(message) = ws_stream.next().await {
        let msg = message.expect("Failed to read message");
        if msg.is_text() {
            println!("Received: {}", msg.to_text().unwrap());
        }
    }
}
```

This example establishes a WebSocket connection to the server and sends a subscription request for orders with the status "Active." The server responses will be printed to the console.

2. TypeScript

In TypeScript, you can use the standard WebSocket API or libraries like apollo-client for subscriptions via GraphQL.

- Install the necessary packages:

```
pnpm add apollo-client @apollo/client subscriptions-transport-ws graphql
```

- Example code for a WebSocket client in TypeScript:

```
import { WebSocketLink } from '@apollo/client/link/ws';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { gql } from 'graphql-tag';

// Establish the WebSocket connection
const wsLink = new WebSocketLink({
  uri: 'ws://localhost:8080/v1/graphql',
  options: {
    reconnect: true,
  },
});

const client = new ApolloClient({
  link: wsLink,
  cache: new InMemoryCache(),
});

// GraphQL subscription
const ORDER_SUBSCRIPTION = gql`
  subscription {
    Order(where: {status: {_eq: "Active"}}) {
      id
      initial_amount
      status
      price
      amount
      order_type
    }
  }
`;

// Subscribe to changes
client.subscribe({ query: ORDER_SUBSCRIPTION }).subscribe({
  next(response) {
    console.log('Received:', response.data);
  },
  error(err) {
    console.error('Error:', err);
  },
});
```

This example uses Apollo Client to establish a WebSocket connection and subscribe to order updates. The received data is logged to the console.