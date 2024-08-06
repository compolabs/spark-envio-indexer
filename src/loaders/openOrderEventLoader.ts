import {
  OrderBookContract_OpenOrderEventEvent_eventArgs,
  OrderBookContract_OpenOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import crypto from "crypto";

export const openOrderEventLoader = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_OpenOrderEventEvent_eventArgs,
  OrderBookContract_OpenOrderEventEvent_loaderContext
>) => {
  context.Order.load(event.data.order_id);
};
