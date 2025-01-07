import { Market, SetMinOrderSizeEvent } from "generated";
import { getISOTime } from "../utils";
import { nanoid } from "nanoid";

Market.SetMinOrderSizeEvent.handlerWithLoader({
	loader: async ({ event, context }) => { },

	handler: async ({ event, context }) => {
		const setMinOrderSizeEvent: SetMinOrderSizeEvent = {
			id: nanoid(),
			market: event.srcAddress,
			size: event.params.size,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.SetMinOrderSizeEvent.set(setMinOrderSizeEvent);
	},
});