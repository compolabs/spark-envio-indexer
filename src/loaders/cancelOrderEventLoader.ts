import {
  OrderBookContract_CancelOrderEventEvent_eventArgs,
  OrderBookContract_CancelOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const cancelOrderEventLoader = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_CancelOrderEventEvent_eventArgs,
  OrderBookContract_CancelOrderEventEvent_loaderContext
>) => {
  context.Order.load(event.data.order_id);
};
