import {
 OrderBook_TradeOrderEventEvent_eventArgs,
 OrderBook_TradeOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const tradeOrderEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBook_TradeOrderEventEvent_eventArgs,
 OrderBook_TradeOrderEventEvent_loaderContext
>) => {
 context.Order.load(event.data.base_buy_order_id);
 context.Order.load(event.data.base_sell_order_id);

 context.Balance.load(event.data.order_seller.payload.bits);
 context.Balance.load(event.data.order_buyer.payload.bits);
};
