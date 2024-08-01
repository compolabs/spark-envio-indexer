import {
  OrderBookContract_TradeOrderEventEvent_eventArgs,
  OrderBookContract_TradeOrderEventEvent_handlerContext,
  TradeOrderEventEntity,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

export const tradeOrderEventHandler = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_TradeOrderEventEvent_eventArgs,
  OrderBookContract_TradeOrderEventEvent_handlerContext
>) => {
  const idSource = getHash(
    `${event.data.order_matcher}-${event.data.trade_size}-${event.data.trade_price}-${event.data.base_sell_order_id}-${event.data.base_buy_order_id}-${event.data.tx_id}`
  );

  const tradeOrderEvent: TradeOrderEventEntity = {
    id: idSource,
    base_sell_order_id: event.data.base_sell_order_id,
    base_buy_order_id: event.data.base_buy_order_id,
    tx_id: event.transactionId,
    order_matcher: event.data.order_matcher.payload.bits,
    trade_size: event.data.trade_size,
    trade_price: event.data.trade_price,
    timestamp: getISOTime(event.time),
  };

  context.TradeOrderEvent.set(tradeOrderEvent);
};
