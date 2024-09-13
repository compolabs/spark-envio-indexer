import {
 OrderBook_DepositEventEvent_eventArgs,
 OrderBook_DepositEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const depositEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBook_DepositEventEvent_eventArgs,
 OrderBook_DepositEventEvent_loaderContext
>) => {
 context.Balance.load(event.data.user.payload.bits);
};


