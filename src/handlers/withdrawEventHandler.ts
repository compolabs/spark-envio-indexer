import {
 OrderBook_WithdrawEventEvent_eventArgs,
 OrderBook_WithdrawEventEvent_handlerContextAsync,
 WithdrawEvent,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

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
  user: event.data.user.payload.bits,
  timestamp: getISOTime(event.time),
  base_amount: event.data.liquid_base,
  quote_amount: event.data.liquid_quote,
 };

 context.WithdrawEvent.set(withdrawEvent);
 const balance = await context.Balance.get(event.data.user.payload.bits);

 if (!balance) {
  return
 }

 const updatedBalance = {
  ...balance,
  base_amount: event.data.liquid_base,
  quote_amount: event.data.liquid_quote,
  timestamp: getISOTime(event.time),
 };
 context.Balance.set(updatedBalance);
};
