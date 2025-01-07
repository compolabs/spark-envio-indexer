import { Market, SetMinOrderPriceEvent } from "generated";
import { getISOTime } from "../utils";
import { nanoid } from "nanoid";

Market.SetMinOrderPriceEvent.handlerWithLoader({
	loader: async ({ event, context }) => { },

	handler: async ({ event, context }) => {
		const setMinOrderPriceEvent: SetMinOrderPriceEvent = {
			id: nanoid(),
			market: event.srcAddress,
			price: event.params.price,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.SetMinOrderPriceEvent.set(setMinOrderPriceEvent);
	},
});