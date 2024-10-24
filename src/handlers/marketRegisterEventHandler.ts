import { Registry } from "generated/src/Handlers.gen";
import { getISOTime } from "../utils";
import type { MarketRegisterEvent } from "generated";

Registry.MarketRegisterEvent.handler(async ({ event, context }) => {
	const marketRegisterEvent: MarketRegisterEvent = {
		id: event.params.market.bits,
		baseAsset: event.params.base.bits,
		quoteAsset: event.params.quote.bits,
		timestamp: getISOTime(event.block.time),
		txId: event.transaction.id,
	};
	context.MarketRegisterEvent.set(marketRegisterEvent);
});

Registry.MarketRegisterEvent.contractRegister(({ event, context }) => {
	const marketAddress = event.params.market.bits;
	context.addMarket(marketAddress);
});
