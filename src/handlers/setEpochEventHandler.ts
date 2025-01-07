import { Market, SetEpochEvent } from "generated";
import { getISOTime } from "../utils";
import { nanoid } from "nanoid";

Market.SetEpochEvent.handlerWithLoader({
	loader: async ({ event, context }) => {},

	handler: async ({ event, context}) => {
		const setEpochEvent: SetEpochEvent = {
			id: nanoid(),
			market: event.srcAddress,
			epoch: event.params.epoch,
      epochDuration: event.params.epoch_duration,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id
		};
		context.SetEpochEvent.set(setEpochEvent);
	},
});