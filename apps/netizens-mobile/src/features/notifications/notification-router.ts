import type { NetizensRoute } from "../../navigation/routes";
const uuid =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function routeNotification(
  payload: Record<string, unknown>,
): NetizensRoute | null {
  if (typeof payload.thread_id === "string" && uuid.test(payload.thread_id))
    return { kind: "thread", threadId: payload.thread_id };
  if (typeof payload.entity_id === "string" && uuid.test(payload.entity_id))
    return { kind: "entity", entityId: payload.entity_id };
  if (payload.notification_type === 'conversation_request') return { kind: 'messages' };
  return null;
}
