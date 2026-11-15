/**
 * NETIZENS LIVE admission preflight. REVIEW ONLY; no stream access is issued.
 *
 * Supabase's default verify_jwt=true must remain enabled. The @supabase/server
 * user-mode wrapper independently verifies the signed-in Citizen JWT. The
 * handler reads only caller-scoped RLS tables and fails closed until a trusted
 * server-owned room registry, moderation, rate limiter, and token signer exist.
 *
 * No provider key, LiveKit token, role, streaming URL, or secret is returned.
 */
import { withSupabase } from "npm:@supabase/server@1";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROOM = /^[a-zA-Z0-9_-]{3,128}$/;
const response = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return response(405, "method_not_allowed");
    if (req.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json")
      return response(415, "json_required");
    const length = req.headers.get("content-length");
    if (length && (!/^\d+$/.test(length) || Number(length) > 1024))
      return response(413, "request_too_large");

    const actorId = ctx.userClaims?.id;
    if (typeof actorId !== "string" || !UUID.test(actorId))
      return response(401, "sign_in_required");

    // Ensure the body cannot request elevated roles or supply authorization
    // facts. Only the destination identifiers are accepted.
    let body: unknown;
    try { body = await req.json(); }
    catch { return response(400, "invalid_request"); }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return response(400, "invalid_request");
    const values = body as Record<string, unknown>;
    if (Object.keys(values).sort().join(",") !== "entityId,roomId" ||
      typeof values.entityId !== "string" || !UUID.test(values.entityId) ||
      typeof values.roomId !== "string" || !ROOM.test(values.roomId))
      return response(400, "invalid_request");

    // Read using the verified caller's RLS context, never a service-role client.
    const citizenResult = await ctx.supabase
      .from("citizens")
      .select("id,status,onboarding_completed_at")
      .eq("id", actorId).maybeSingle();
    if (citizenResult.error) return response(503, "identity_check_unavailable");
    const citizen = citizenResult.data;
    if (!citizen || citizen.status !== "active" || !citizen.onboarding_completed_at)
      return response(403, "citizen_not_eligible");

    const entityResult = await ctx.supabase
      .from("world_entities")
      .select("id,status,visibility,creator_id")
      .eq("id", values.entityId).maybeSingle();
    if (entityResult.error) return response(503, "entity_check_unavailable");
    if (!entityResult.data || entityResult.data.status !== "active")
      return response(404, "live_room_unavailable");

    // CRITICAL: No persistent LiveRoom registry or provider signer exists.
    // RLS entity visibility alone is insufficient to issue stream access.
    // This route is permanently fail-closed until a separately reviewed
    // server-side admission + token issuer is implemented and tested.
    return response(503, "live_streaming_not_activated");
  }),
};
