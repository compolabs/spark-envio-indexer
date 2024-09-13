import {
 OrderBook_WithdrawEventEvent_eventArgs,
 OrderBook_WithdrawEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const withdrawEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBook_WithdrawEventEvent_eventArgs,
 OrderBook_WithdrawEventEvent_loaderContext
>) => {
 context.Balance.load(event.data.user.payload.bits);
};
