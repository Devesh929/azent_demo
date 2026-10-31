import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Invitation tokens are shown once and stored only as a SHA-256 hash.
export function newInviteToken() {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const INVITE_TTL_DAYS = 7;
