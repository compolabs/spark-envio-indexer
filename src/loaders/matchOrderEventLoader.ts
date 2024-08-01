import {
  OrderBookContract_MatchOrderEventEvent_eventArgs,
  OrderBookContract_MatchOrderEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const matchOrderEventLoader = ({
  event,
  context,
}: handlerArgs<
  OrderBookContract_MatchOrderEventEvent_eventArgs,
  OrderBookContract_MatchOrderEventEvent_loaderContext
>) => {
  context.Order.load(event.data.order_id);
};
