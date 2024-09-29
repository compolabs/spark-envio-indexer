import { OrderBookContract } from "generated";

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

OrderBookContract.OpenOrderEvent.loader(openOrderEventLoader);
OrderBookContract.OpenOrderEvent.handler(openOrderEventHandler);

OrderBookContract.CancelOrderEvent.loader(cancelOrderEventLoader);
OrderBookContract.CancelOrderEvent.handler(cancelOrderEventHandler);

OrderBookContract.TradeOrderEvent.loader(tradeOrderEventLoader);
OrderBookContract.TradeOrderEvent.handler(tradeOrderEventHandler);

OrderBookContract.DepositEvent.loader(depositEventLoader);
OrderBookContract.DepositEvent.handler(depositEventHandler);

OrderBookContract.WithdrawEvent.loader(withdrawEventLoader);
OrderBookContract.WithdrawEvent.handler(withdrawEventHandler);