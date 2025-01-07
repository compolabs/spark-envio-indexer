import { Market, SetProtocolFeeEvent, ProtocolFee } from "generated";
import { getISOTime } from "../utils";
import { nanoid } from "nanoid";

Market.SetProtocolFeeEvent.handlerWithLoader({
	loader: async ({ event, context }) => { },

	handler: async ({ event, context }) => {
		const setProtocolFeeEvent: SetProtocolFeeEvent = {
			id: nanoid(),
			market: event.srcAddress,
			timestamp: getISOTime(event.block.time),
			txId: event.transaction.id,
		};

		context.SetProtocolFeeEvent.set(setProtocolFeeEvent);

		for (const [index, fee] of event.params.protocol_fee.entries()) {
			const protocolFee: ProtocolFee = {
				id: event.srcAddress,
				// market: event.srcAddress,
				makerFee: fee.maker_fee,
				takerFee: fee.taker_fee,
				volumeThreshold: fee.volume_threshold,
				eventId: setProtocolFeeEvent.id,
				timestamp: getISOTime(event.block.time),
			};

			context.ProtocolFee.set(protocolFee);
		}
	},
});