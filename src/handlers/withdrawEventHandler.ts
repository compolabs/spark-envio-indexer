import {
 OrderBook_WithdrawEventEvent_eventArgs,
 OrderBook_WithdrawEventEvent_handlerContextAsync,
 WithdrawEvent,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const withdrawEventHandler = async ({
 event,
 context,
}: handlerArgs<
 OrderBook_WithdrawEventEvent_eventArgs,
 OrderBook_WithdrawEventEvent_handlerContextAsync
>) => {
 const withdrawEvent: WithdrawEvent = {
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

 const balance = await context.Balance.get(balanceId);

 if (!balance) {
  context.log.error(
   `Cannot find a balance; user:${event.data.user.payload.bits}; asset: ${event.data.asset.bits}; id: ${balanceId}`
  );
  return;
 }

 const updatedAmount = balance.amount - event.data.amount;
 context.Balance.set({ ...balance, amount: updatedAmount });
};
