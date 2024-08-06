import {
  OrderBookContract_WithdrawEventEvent_eventArgs,
  OrderBookContract_WithdrawEventEvent_handlerContext,
  WithdrawEventEntity,
  BalanceEntity
} from "generated";
import { handlerArgs } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { getHash } from "../utils/getHash";

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

  const balanceId = getHash(
    `${event.data.asset.bits}-${event.data.user.payload.bits}`
  );

  const balance: BalanceEntity = {
    ...withdrawEvent,
    id: balanceId,
  };
  context.Balance.set(balance);

  const updatedAmount = balance.amount - event.data.amount;

  const updatedBalance: BalanceEntity = { ...balance, amount: updatedAmount };
  
  context.Balance.set(updatedBalance);

};
