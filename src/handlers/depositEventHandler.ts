import {
 DepositEvent,
 OrderBook_DepositEventEvent_eventArgs,
 OrderBook_DepositEventEvent_handlerContextAsync,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

export const depositEventHandler = async({
 event,
 context,
}: handlerArgs<
 OrderBook_DepositEventEvent_eventArgs,
 OrderBook_DepositEventEvent_handlerContextAsync
>) => {
 const depositEvent: DepositEvent = {
  id: nanoid(),
  user: event.data.user.payload.bits,
  amount: event.data.amount,
  asset: event.data.asset.bits,
  base_amount: event.data.liquid_base,
  quote_amount: event.data.liquid_quote,
  tx_id: event.transactionId,
  timestamp: getISOTime(event.time),
 };

 context.DepositEvent.set(depositEvent);
 const balance = await context.Balance.get(event.data.user.payload.bits);

 if (!balance) {
  context.Balance.set({
   ...depositEvent,
   id: event.data.user.payload.bits,
  });
  return;
 }

 const updatedBalance = {
  ...balance,
  base_amount: event.data.liquid_base, 
  quote_amount: event.data.liquid_quote,
  timestamp: getISOTime(event.time),
 };

 context.Balance.set(updatedBalance);
};

