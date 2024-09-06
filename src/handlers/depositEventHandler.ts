import {
 DepositEvent,
 OrderBook_DepositEventEvent_eventArgs,
 OrderBook_DepositEventEvent_handlerContextAsync,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";
import { BASE_ASSET, QUOTE_ASSET } from "../utils/marketConfig";

export const depositEventHandler = async({
 event,
 context,
}: handlerArgs<
 OrderBook_DepositEventEvent_eventArgs,
 OrderBook_DepositEventEvent_handlerContextAsync
>) => {
 const depositEvent: DepositEvent = {
  id: nanoid(),
  tx_id: event.transactionId,
  amount: event.data.amount,
  asset: event.data.asset.bits,
  user: event.data.user.payload.bits,
  timestamp: getISOTime(event.time),
 };
 context.DepositEvent.set(depositEvent);

 const asset = event.data.asset.bits;

 const isBaseAsset = asset === BASE_ASSET;

 const balanceId = isBaseAsset
  ? getHash(`${BASE_ASSET}-${event.data.user.payload.bits}`) 
  : getHash(`${QUOTE_ASSET}-${event.data.user.payload.bits}`);

 const balance = await context.Balance.get(balanceId);

 if (!balance) {
  context.Balance.set({ ...depositEvent, id: balanceId });
  return;
 }

 const updatedAmount = balance.amount + event.data.amount;
 context.Balance.set({ ...balance, amount: updatedAmount });
};
