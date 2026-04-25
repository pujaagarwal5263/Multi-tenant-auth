import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me";
const ACCESS_EXPIRY_SECONDS = parseInt(process.env.JWT_ACCESS_EXPIRY_SECONDS || "900", 10); // 15 min
const REFRESH_EXPIRY_SECONDS = parseInt(process.env.JWT_REFRESH_EXPIRY_SECONDS || "604800", 10); // 7 days

export interface JwtPayload {
  sub: string; // userId (UUID only, no PII)
}

export function generateAccessToken(userId: string): string {
  const payload: JwtPayload = { sub: userId };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY_SECONDS });
}

export function generateRefreshToken(userId: string): string {
  const payload: JwtPayload = { sub: userId };
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY_SECONDS });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}
