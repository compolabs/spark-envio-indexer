import { Market, SetMatcherRewardEvent } from "generated";
import { getISOTime } from "../utils";
import { nanoid } from "nanoid";

Market.SetMatcherRewardEvent.handlerWithLoader({
	loader: async ({ event, context }) => { },

	handler: async ({ event, context }) => {
		const setMatcherRewardEvent: SetMatcherRewardEvent = {
			id: nanoid(),
			market: event.srcAddress,
			amount: event.params.amount,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.SetMatcherRewardEvent.set(setMatcherRewardEvent);
	},
});