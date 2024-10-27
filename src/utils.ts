import type { handlerContext } from "generated";
import type { Balance_t } from "generated/src/db/Entities.gen";
import crypto from "node:crypto";

export const getHash = (data: string) => {
	return crypto.createHash("sha256").update(data).digest("hex");
};

export const getISOTime = (timeInSeconds: number) => {
	return new Date(timeInSeconds * 1000).toISOString();
};

export function updateUserBalance(eventName: string, context: handlerContext, event: any, balance: Balance_t | undefined, baseAmount: bigint, quoteAmount: bigint, user: string, time: number) {
	if (balance) {
		const updatedBalance = {
			...balance,
			baseAmount,
			quoteAmount,
			timestamp: getISOTime(time),
		};
		context.Balance.set(updatedBalance);
	} else {
		if (eventName === "WITHDRAW_TO.") {
			const balance = {
				id: getHash(`${user}-${event.srcAddress}`),
				user,
				market: event.params.market.bits,
				baseAmount,
				quoteAmount,
				timestamp: getISOTime(time),
			};
			context.Balance.set(balance);
		} else {
			context.log.error(`${eventName} NO BALANCE ${getHash(`${event.params.user.payload.bits}-${event.srcAddress}`)} FOR USER ${user}`);
		}
	}
}