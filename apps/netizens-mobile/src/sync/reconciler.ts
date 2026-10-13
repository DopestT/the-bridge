import { ApiError } from "../api/netizens-repository.ts";
import type { NetizensRepository } from "../api/netizens-repository.ts";
import type { ProjectionStore } from "../storage/projections.ts";
import type { Outbox } from "./outbox.ts";
export class Reconciler {
  private outbox: Outbox;
  private repository: NetizensRepository;
  private projections: ProjectionStore;
  private session: () => { userId: string };
  private running = false;
  private idleWaiters: (() => void)[] = [];
  async whenIdle(): Promise<void> {
    if (this.running)
      await new Promise<void>((resolve) => this.idleWaiters.push(resolve));
  }
  constructor(
    outbox: Outbox,
    repository: NetizensRepository,
    projections: ProjectionStore,
    session: () => { userId: string },
  ) {
    this.outbox = outbox;
    this.repository = repository;
    this.projections = projections;
    this.session = session;
  }
  async syncOnce() {
    if (this.running) return { paused: true, applied: 0 };
    try {
      if (this.session().userId !== this.outbox.owner)
        return { paused: true, applied: 0 };
    } catch {
      return { paused: true, applied: 0 };
    }
    this.running = true;
    let applied = 0;
    try {
      for (const i of await this.outbox.claimBatch(1)) {
        const collection =
          i.kind === "message.send"
            ? "threads"
            : i.kind === "discussion.post"
              ? "discussion"
              : i.kind === "notification.read"
                ? "notifications"
                : "memberships";
        try {
          if (this.session().userId !== this.outbox.owner)
            throw new ApiError("auth", "Account changed");
          const row = await this.repository.apply(i);
          if (this.session().userId !== this.outbox.owner)
            throw new ApiError("auth", "Account changed");
          await this.projections.put(
            collection,
            i.mutationId,
            row,
            "canonical",
          );
          await this.outbox.markApplied(i);
          applied++;
        } catch (e) {
          try {
            if (this.session().userId !== this.outbox.owner)
              return { paused: true, applied };
          } catch {
            return { paused: true, applied };
          }
          const kind = e instanceof ApiError ? e.kind : "server";
          if (["authorization", "validation", "conflict"].includes(kind)) {
            await this.projections.put(
              collection,
              i.mutationId,
              i.payload,
              "rejected",
            );
            await this.outbox.markTerminal(i, kind);
          } else {
            await this.outbox.markRetry(i, kind);
            if (kind === "auth") return { paused: true, applied };
          }
        }
      }
      return { paused: false, applied };
    } finally {
      this.running = false;
      for (const resolve of this.idleWaiters.splice(0)) resolve();
    }
  }
}
