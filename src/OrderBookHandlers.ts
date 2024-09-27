import { OrderBook } from "generated";

import {
  cancelOrderEventLoader,
  openOrderEventLoader,
  tradeOrderEventLoader,
  depositEventLoader,
  withdrawEventLoader
} from "./loaders";

import {
  cancelOrderEventHandler,
  openOrderEventHandler,
  tradeOrderEventHandler,
  depositEventHandler,
  withdrawEventHandler
} from "./handlers";

OrderBook.OpenOrderEvent.loader(openOrderEventLoader);
OrderBook.OpenOrderEvent.handler(openOrderEventHandler);

OrderBook.CancelOrderEvent.loader(cancelOrderEventLoader);
OrderBook.CancelOrderEvent.handler(cancelOrderEventHandler);

OrderBook.TradeOrderEvent.loader(tradeOrderEventLoader);
OrderBook.TradeOrderEvent.handler(tradeOrderEventHandler);

OrderBook.DepositEvent.loader(depositEventLoader);
OrderBook.DepositEvent.handler(depositEventHandler);

OrderBook.WithdrawEvent.loader(withdrawEventLoader);
OrderBook.WithdrawEvent.handler(withdrawEventHandler);
