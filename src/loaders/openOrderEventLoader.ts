import {
  OrderBook_OpenOrderEventEvent_eventArgs,
  OrderBook_OpenOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const openOrderEventLoader = ({
  event,
  context,
}: handlerArgs<
  OrderBook_OpenOrderEventEvent_eventArgs,
  OrderBook_OpenOrderEventEvent_loaderContext
>) => {
  context.Order.load(event.data.order_id);
  context.Balance.load(event.data.user.payload.bits);
  
};
