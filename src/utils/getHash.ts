import crypto from "crypto";

export const getHash = (data: string) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};
