## Spark OrderBook indexer

Rebuild the https://github.com/compolabs/orderbook-indexer with Envio.

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
