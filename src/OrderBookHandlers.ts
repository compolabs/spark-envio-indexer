import { OrderBookContract } from "generated";

import {
  cancelOrderEventLoader,
  openOrderEventLoader,
  tradeOrderEventLoader
} from "./loaders";

import {
  cancelOrderEventHandler,
  openOrderEventHandler,
  tradeOrderEventHandler,
} from "./handlers";

OrderBookContract.OpenOrderEvent.loader(openOrderEventLoader);
OrderBookContract.OpenOrderEvent.handler(openOrderEventHandler);

OrderBookContract.CancelOrderEvent.loader(cancelOrderEventLoader);
OrderBookContract.CancelOrderEvent.handler(cancelOrderEventHandler);

OrderBookContract.TradeOrderEvent.loader(tradeOrderEventLoader);
OrderBookContract.TradeOrderEvent.handler(tradeOrderEventHandler);
