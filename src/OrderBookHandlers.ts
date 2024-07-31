import { OrderBookContract } from "generated";

import {
  cancelOrderEventLoader,
  depositEventLoader,
  matchOrderEventLoader,
  openOrderEventLoader,
  withdrawEventLoader,
} from "./loaders";

import {
  cancelOrderEventHandler,
  depositEventHandler,
  matchOrderEventHandler,
  openOrderEventHandler,
  tradeOrderEventHandler,
  withdrawEventHandler,
} from "./handlers";

OrderBookContract.OpenOrderEvent.loader(openOrderEventLoader);
OrderBookContract.OpenOrderEvent.handler(openOrderEventHandler);

OrderBookContract.CancelOrderEvent.loader(cancelOrderEventLoader);
OrderBookContract.CancelOrderEvent.handler(cancelOrderEventHandler);

OrderBookContract.MatchOrderEvent.loader(matchOrderEventLoader);
OrderBookContract.MatchOrderEvent.handler(matchOrderEventHandler);

OrderBookContract.TradeOrderEvent.handler(tradeOrderEventHandler);

OrderBookContract.DepositEvent.loader(depositEventLoader);
OrderBookContract.DepositEvent.handler(depositEventHandler);

OrderBookContract.WithdrawEvent.loader(withdrawEventLoader);
OrderBookContract.WithdrawEvent.handler(withdrawEventHandler);
