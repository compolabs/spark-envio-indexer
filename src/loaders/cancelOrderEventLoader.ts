import {
  OrderBookContract_CancelOrderEventEvent_eventArgs,
  OrderBookContract_CancelOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const cancelOrderEventLoader = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_CancelOrderEventEvent_eventArgs,
  OrderBookContract_CancelOrderEventEvent_loaderContext
>) => {
  context.Order.load(event.data.order_id);

  const quoteBalance = getHash(`${QUOTE_ASSET}-${event.data.user.payload.bits}`);
  const baseBalance = getHash(`${BASE_ASSET}-${event.data.user.payload.bits}`);

  context.Balance.load(quoteBalance);
  context.Balance.load(baseBalance);
};