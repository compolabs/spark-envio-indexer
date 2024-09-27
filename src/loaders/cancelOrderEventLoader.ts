import {
  OrderBook_CancelOrderEventEvent_eventArgs,
  OrderBook_CancelOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const cancelOrderEventLoader = ({
  event,
  context,
}: handlerArgs<
  OrderBook_CancelOrderEventEvent_eventArgs,
  OrderBook_CancelOrderEventEvent_loaderContext
>) => {
  context.Order.load(event.data.order_id);
  context.Balance.load(event.data.user.payload.bits);
};