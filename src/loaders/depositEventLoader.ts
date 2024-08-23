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
};
