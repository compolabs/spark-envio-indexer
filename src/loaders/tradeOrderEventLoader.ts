import {
 OrderBookContract_TradeOrderEventEvent_eventArgs,
 OrderBookContract_TradeOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const tradeOrderEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_TradeOrderEventEvent_eventArgs,
 OrderBookContract_TradeOrderEventEvent_loaderContext
>) => {
 context.Order.load(event.data.base_buy_order_id);
 context.Order.load(event.data.base_sell_order_id);

 const buyerBalanceId = getHash(`${BASE_ASSET}-${event.data.order_buyer.payload.bits}`);
 const sellerBalanceId = getHash(`${QUOTE_ASSET}-${event.data.order_seller.payload.bits}`);

 context.Balance.load(buyerBalanceId);
 context.Balance.load(sellerBalanceId);
};
