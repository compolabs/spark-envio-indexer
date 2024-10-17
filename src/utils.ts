import type { handlerContext } from "generated";
import type { Balance_t } from "generated/src/db/Entities.gen";
import crypto from "node:crypto";

export const getHash = (data: string) => {
	return crypto.createHash("sha256").update(data).digest("hex");
};

export const getISOTime = (timeInSeconds: number) => {
	return new Date(timeInSeconds * 1000).toISOString();
};

export async function updateUserBalance(context: handlerContext, balance: Balance_t | undefined, baseAmount: bigint, quoteAmount: bigint, user: string, time: number) {
	if (balance) {
		const updatedBalance = {
			...balance,
			baseAmount,
			quoteAmount,
			timestamp: getISOTime(time),
		};
		context.Balance.set(updatedBalance);
	} else {
		context.log.error(`Cannot find a balance for user ${user}`);
	}
}