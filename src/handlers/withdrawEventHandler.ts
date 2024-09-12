import {
 OrderBookContract_WithdrawEventEvent_eventArgs,
 OrderBookContract_WithdrawEventEvent_handlerContext,
 WithdrawEventEntity,
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";

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
  user: event.data.user.payload.bits,
  timestamp: getISOTime(event.time),
  base_amount: event.data.liquid_base,
  quote_amount: event.data.liquid_quote,
 };

 context.WithdrawEvent.set(withdrawEvent);
 const balance = context.Balance.get(event.data.user.payload.bits);

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
