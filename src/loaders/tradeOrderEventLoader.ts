import {
 OrderBookContract_TradeOrderEventEvent_eventArgs,
 OrderBookContract_TradeOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const tradeOrderEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_TradeOrderEventEvent_eventArgs,
 OrderBookContract_TradeOrderEventEvent_loaderContext
>) => {
 context.Order.load(event.data.base_buy_order_id);
 context.Order.load(event.data.base_sell_order_id);
};
