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