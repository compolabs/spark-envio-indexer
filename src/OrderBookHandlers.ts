import { OrderBookContract } from "generated";

import {
  cancelOrderEventLoader,
  matchOrderEventLoader,
  openOrderEventLoader,
} from "./loaders";

import {
  cancelOrderEventHandler,
  matchOrderEventHandler,
  openOrderEventHandler,
  tradeOrderEventHandler,
} from "./handlers";

OrderBookContract.OpenOrderEvent.loader(openOrderEventLoader);
OrderBookContract.OpenOrderEvent.handler(openOrderEventHandler);

OrderBookContract.CancelOrderEvent.loader(cancelOrderEventLoader);
OrderBookContract.CancelOrderEvent.handler(cancelOrderEventHandler);

OrderBookContract.MatchOrderEvent.loader(matchOrderEventLoader);
OrderBookContract.MatchOrderEvent.handler(matchOrderEventHandler);

OrderBookContract.TradeOrderEvent.handler(tradeOrderEventHandler);

