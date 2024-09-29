import {
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_loaderContext,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const withdrawEventLoader = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_loaderContext
>) => {
 const asset = event.data.asset.bits;

 const isBaseAsset = asset === BASE_ASSET;

 const balanceId = isBaseAsset
  ? getHash(`${BASE_ASSET}-${event.data.user.payload.bits}`)
  : getHash(`${QUOTE_ASSET}-${event.data.user.payload.bits}`);

 context.Balance.load(balanceId);
};