import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  if (expectedBuffer.length !== actual.length) return false;
  return timingSafeEqual(actual, expectedBuffer);
}

export function newOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function tokenHash(token: string, key: string): string {
  return createHmac("sha256", key).update(token).digest("hex");
}
