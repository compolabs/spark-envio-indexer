import { Registry } from "generated/src/Handlers.gen";
import { getISOTime } from "../utils/getISOTime";
import type { MarketRegisterEvent } from "generated";

Registry.MarketRegisterEvent.handler(async ({ event, context }) => {
	const marketRegisterEvent: MarketRegisterEvent = {
		id: event.params.market.bits,
		base_asset: event.params.base.bits,
		quote_asset: event.params.quote.bits,
		timestamp: getISOTime(event.block.time),
		tx_id: event.transaction.id,
	};
	context.MarketRegisterEvent.set(marketRegisterEvent);
});

Registry.MarketRegisterEvent.contractRegister(({ event, context }) => {
	const marketAddress = event.params.market.bits;
	context.addMarket(marketAddress);
});
