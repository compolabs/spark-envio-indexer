import {
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_handlerContext,
 WithdrawEventEntity,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const withdrawEventHandler = ({
 event,
 context,
}: handlerArgs<
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_handlerContext
>) => {
 const withdrawEvent: WithdrawEventEntity = {
  id: nanoid(),
  tx_id: event.transactionId,
  amount: event.data.amount,
  asset: event.data.asset.bits,
  user: event.data.user.payload.bits,
  timestamp: getISOTime(event.time),
 };
 context.WithdrawEvent.set(withdrawEvent);

 const asset = event.data.asset.bits;

 const isBaseAsset = asset === BASE_ASSET;

 const balanceId = isBaseAsset
  ? getHash(`${BASE_ASSET}-${event.data.user.payload.bits}`)
  : getHash(`${QUOTE_ASSET}-${event.data.user.payload.bits}`);

 const balance = context.Balance.get(balanceId);

 if (!balance) {
  context.log.error(
   `Cannot find a balance; user:${event.data.user.payload.bits}; asset: ${event.data.asset.bits}; id: ${balanceId}`
  );
  return;
 }

 const updatedAmount = balance.amount - event.data.amount;
 context.Balance.set({ ...balance, amount: updatedAmount });
};