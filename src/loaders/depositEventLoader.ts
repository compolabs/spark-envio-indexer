import {
 OrderBookContract_DepositEventEvent_eventArgs,
 OrderBookContract_DepositEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";

export const depositEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_DepositEventEvent_eventArgs,
 OrderBookContract_DepositEventEvent_loaderContext
>) => {
 context.Balance.load(event.data.user.payload.bits);
};


