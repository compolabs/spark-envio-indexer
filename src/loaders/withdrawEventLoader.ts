import {
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getHash } from "../utils/getHash";

export const withdrawEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_loaderContext
>) => {
 const idSource = getHash(
  `${event.data.asset.bits}-${event.data.user.payload.bits}`
 );
 context.Balance.load(idSource);
};