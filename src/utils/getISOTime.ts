export const getISOTime = (timeInSeconds: number) => {
	return new Date(timeInSeconds * 1000).toISOString();
};
