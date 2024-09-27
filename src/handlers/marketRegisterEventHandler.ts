import { MarketRegistry } from "generated/src/Handlers.gen";
import { nanoid } from "nanoid";
import { getISOTime } from "../utils/getISOTime";
import { MarketRegisterEvent } from "generated";


MarketRegistry.MarketRegisterEvent.handler(
  async ({ event, context }) => {
    const marketRegisterEvent: MarketRegisterEvent = {
      id: nanoid(),
      base_asset: event.params.base.bits,
      quote_asset: event.params.quote.bits,
      market: event.params.market.bits,
      timestamp: getISOTime(event.block.time),
    };
    context.MarketRegisterEvent.set(marketRegisterEvent);

  },
);

MarketRegistry.MarketRegisterEvent.contractRegister(({ event, context }) => {
  const marketAddress = event.params.market.bits;
  context.addOrderBook(marketAddress);
});
