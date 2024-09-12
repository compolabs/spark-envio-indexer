import {
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const withdrawEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_loaderContext
>) => {
 context.Balance.load(event.data.user.payload.bits);
};
