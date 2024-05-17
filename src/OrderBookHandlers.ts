import { OrderBookContract } from "generated";
import { nanoid } from "nanoid";

function tai64ToDate(tai64nBigInt: bigint) {
  // Split the BigInt into two parts: the first 8 bytes (seconds) and the next 4 bytes (nanoseconds)
  let taiSeconds = tai64nBigInt >> 32n;
  let nanoseconds = tai64nBigInt & 0xffffffffn;

  // Adjust for the 10-second difference between TAI and Unix epochs
  let unixTimestamp = taiSeconds - 10n;

  // Convert the Unix timestamp to milliseconds
  let milliseconds = unixTimestamp * 1000n + nanoseconds / 1000000n;

  return new Date(Number(milliseconds)).toISOString();
}

OrderBookContract.MarketCreateEvent.loader(({ event, context }) => {});

OrderBookContract.MarketCreateEvent.handler(({ event, context }) => {
  context.SpotMarketCreateEvent.set({
    id: nanoid(),
    asset_decimals: event.data.asset_decimals,
    asset_id: event.data.asset_id.value,
    timestamp: tai64ToDate(event.data.timestamp),
  });
});
