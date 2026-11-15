/**
 * NETIZENS LIVE review-only contract.
 *
 * This module neither connects to a streaming provider nor issues tokens.
 * Only an authenticated NETIZENS backend may authorize role, participation,
 * moderation, viewer counts, and LiveKit join grants.
 */
export type LiveRole = "host" | "moderator" | "viewer";
export type LiveRoomStatus = "scheduled" | "live" | "ended";

export type LiveJoinRequest = Readonly<{
  roomId: string;
  entityId: string;
}>;

export type LiveJoinGrant = Readonly<{
  roomId: string;
  entityId: string;
  role: LiveRole;
  serverUrl: string;
  accessToken: string;
  expiresAtMs: number;
}>;

const SAFE_ID = /^[a-zA-Z0-9_-]{3,128}$/;
const MAX_GRANT_LIFETIME_MS = 15 * 60 * 1000;

/** Requests a room only. The caller cannot select or escalate its role. */
export function makeLiveJoinRequest(roomId: string, entityId: string): LiveJoinRequest {
  if (!SAFE_ID.test(roomId) || !SAFE_ID.test(entityId)) {
    throw new Error("Invalid live room or World Entity identifier");
  }
  return Object.freeze({ roomId, entityId });
}

/**
 * Validate the shape of a short-lived grant returned by our backend.
 * This is client-side defense in depth, NOT JWT signature validation.
 * The backend must check the signed-in Citizen, Entity membership,
 * block status, stream eligibility, roles, and rate limits before issuing it.
 */
export function validateLiveJoinGrant(
  value: unknown,
  expected: LiveJoinRequest,
  nowMs: number = Date.now(),
): LiveJoinGrant {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid live access grant");
  }
  const grant = value as Record<string, unknown>;
  if (
    grant.roomId !== expected.roomId ||
    grant.entityId !== expected.entityId ||
    !["host", "moderator", "viewer"].includes(String(grant.role)) ||
    typeof grant.serverUrl !== "string" ||
    !/^wss:\/\/[^/?#\s]+(?:\/[^?#\s]*)?$/.test(grant.serverUrl) ||
    typeof grant.accessToken !== "string" ||
    grant.accessToken.length < 16 ||
    !Number.isSafeInteger(grant.expiresAtMs) ||
    (grant.expiresAtMs as number) <= nowMs ||
    (grant.expiresAtMs as number) > nowMs + MAX_GRANT_LIFETIME_MS
  ) {
    throw new Error("Invalid or expired live access grant");
  }
  return Object.freeze({
    roomId: expected.roomId,
    entityId: expected.entityId,
    role: grant.role as LiveRole,
    serverUrl: grant.serverUrl,
    accessToken: grant.accessToken,
    expiresAtMs: grant.expiresAtMs as number,
  });
}

/** Display only a nonnegative count certified by the NETIZENS server. */
export function viewerCountLabel(value: unknown, isServerVerified: boolean): string {
  if (!isServerVerified || !Number.isSafeInteger(value) || (value as number) < 0) {
    return "Viewer count unavailable";
  }
  return "Viewers: " + String(value);
}
