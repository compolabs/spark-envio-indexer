import {
 OrderBookContract_DepositEventEvent_eventArgs,
 OrderBookContract_DepositEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import crypto from "crypto";
import { getHash } from "../utils/getHash";

export const depositEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_DepositEventEvent_eventArgs,
 OrderBookContract_DepositEventEvent_loaderContext
>) => {
 const idSource = getHash(
  `${event.data.asset.bits}-${event.data.user.payload.bits}`
 );
 context.Balance.load(idSource);

 const idSource1 = getHash(
  `0x336b7c06352a4b736ff6f688ba6885788b3df16e136e95310ade51aa32dc6f05-${event.data.user.payload.bits}`
 );
 context.Balance.load(idSource1);
};