import type { Outbox } from "../../sync/outbox.ts";
import type { ProjectionStore } from "../../storage/projections.ts";
import type { MutationKind } from "../../sync/types.ts";
export async function participate(
  runtime: { outbox: Outbox; projections: ProjectionStore },
  entity: { id: string; place_id: string },
  kind: MutationKind,
  payload: Record<string, unknown> = {},
) {
  if (entity.place_id === "circles")
    throw new Error("Use the private conversation for this Circle");
  if (
    kind === "discussion.post" &&
    (typeof payload.body !== "string" ||
      !payload.body.trim() ||
      payload.body.length > 5000)
  )
    throw new Error("Write between 1 and 5000 characters");
  const item = await runtime.outbox.enqueue(kind, {
    ...payload,
    entityId: entity.id,
  });
  await runtime.projections.put(
    kind === "discussion.post" ? "discussion" : "memberships",
    item.mutationId,
    item.payload,
    "pending",
  );
  return item;
}
