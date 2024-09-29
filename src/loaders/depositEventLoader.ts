import {
 OrderBookContract_DepositEventEvent_eventArgs,
 OrderBookContract_DepositEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const depositEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_DepositEventEvent_eventArgs,
 OrderBookContract_DepositEventEvent_loaderContext
>) => {
 const asset = event.data.asset.bits

 const isBaseAsset = asset === BASE_ASSET

 const balanceId = isBaseAsset
  ? getHash(`${BASE_ASSET}-${event.data.user.payload.bits}`)
  : getHash(`${QUOTE_ASSET}-${event.data.user.payload.bits}`)

 context.Balance.load(balanceId)
};