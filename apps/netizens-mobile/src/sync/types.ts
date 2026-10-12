export type ErrorClass =
  | "transient"
  | "offline"
  | "auth"
  | "authorization"
  | "validation"
  | "conflict"
  | "server";
export type MutationKind =
  | "membership.join"
  | "membership.leave"
  | "discussion.post"
  | "message.send"
  | "notification.read";
export type OutboxItem = {
  mutationId: string;
  kind: MutationKind;
  payload: Record<string, unknown>;
  attempts: number;
  leaseUntil: number;
};

export type PendingAction = OutboxItem & {
  status: "queued" | "inflight" | "rejected";
  lastError: ErrorClass | null;
};
