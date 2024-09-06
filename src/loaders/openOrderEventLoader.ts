import {
  OrderBook_OpenOrderEventEvent_eventArgs,
  OrderBook_OpenOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const openOrderEventLoader = ({
  event,
  context,
}: handlerArgs<
  OrderBook_OpenOrderEventEvent_eventArgs,
  OrderBook_OpenOrderEventEvent_loaderContext
>) => {
  context.Order.load(event.data.order_id);

  const orderType = event.data.order_type.case;

  if (orderType === "Buy") {
    const balanceId = getHash(`${QUOTE_ASSET}-${event.data.user.payload.bits}`);
    context.Balance.load(balanceId);
  } else if (orderType === "Sell") {
    const balanceId = getHash(`${BASE_ASSET}-${event.data.user.payload.bits}`);
    context.Balance.load(balanceId);
  }
};
