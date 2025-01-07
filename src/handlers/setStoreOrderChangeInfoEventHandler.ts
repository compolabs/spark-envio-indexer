import { Market, SetStoreOrderChangeInfoEvent } from "generated";
import { getISOTime } from "../utils";
import { nanoid } from "nanoid";

Market.SetStoreOrderChangeInfoEvent.handlerWithLoader({
	loader: async ({ event, context }) => { },

	handler: async ({ event, context }) => {
		const setStoreOrderChangeInfoEvent: SetStoreOrderChangeInfoEvent = {
			id: nanoid(),
			market: event.srcAddress,
			store: event.params.store,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.SetStoreOrderChangeInfoEvent.set(setStoreOrderChangeInfoEvent);
	},
});