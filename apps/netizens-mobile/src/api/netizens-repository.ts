import type { ErrorClass, OutboxItem } from "../sync/types.ts";
export type Place = { id: string; name: string; purpose: string };
export type Entity = {
  id: string;
  place_id: string;
  title: string;
  summary: string;
  visibility: string;
  parent_entity_id: string | null;
  metadata: Record<string, unknown>;
};
export type Discussion = {
  id: string;
  entity_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  provenance: string;
  client_mutation_id: string;
};
export type Notice = {
  id: string;
  notification_type: string;
  entity_id: string | null;
  thread_id: string | null;
  read_at: string | null;
};
export type Thread = { id: string; title: string | null; kind: string };
export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
};
export class ApiError extends Error {
  kind: ErrorClass;
  code: string;
  constructor(kind: ErrorClass, message: string, code = "") {
    super(message);
    this.kind = kind;
    this.code = code;
  }
}
export class NetizensRepository {
  private url: string;
  private key: string;
  private session: () => { userId: string; accessToken: string };
  private fetcher: typeof fetch;
  constructor(
    url: string,
    key: string,
    session: () => { userId: string; accessToken: string },
    fetcher: typeof fetch = fetch,
  ) {
    this.url = url;
    this.key = key;
    this.session = session;
    this.fetcher = fetcher;
  }
  private async request<T>(
    table: string,
    query: Record<string, string> = {},
    method = "GET",
    body?: unknown,
  ): Promise<T[]> {
    let auth;
    try {
      auth = this.session();
    } catch {
      throw new ApiError("auth", "Sign in to continue");
    }
    const url = `${this.url}/rest/v1/${table}?${new URLSearchParams(query)}`;
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method,
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ApiError("offline", "Connection unavailable");
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const kind: ErrorClass =
        response.status === 401
          ? "auth"
          : response.status === 403
            ? "authorization"
            : response.status === 409
              ? "conflict"
              : response.status === 429
                ? "transient"
                : response.status >= 500
                  ? "server"
                  : "validation";
      throw new ApiError(kind, "Unable to complete request", error.code);
    }
    if (response.status === 204) return [];
    return (await response.json()) as T[];
  }
  places() {
    return this.request<Place>("places", {
      select: "id,name,purpose",
      is_world_visible: "eq.true",
      order: "id",
      limit: "50",
    });
  }
  entities(place: string, offset = 0) {
    return this.request<Entity>("world_entities", {
      select: "*",
      place_id: `eq.${place}`,
      order: "created_at.desc,id",
      limit: "50",
      offset: String(Math.max(0, offset)),
    });
  }
  async entity(id: string) {
    return (
      (
        await this.request<Entity>("world_entities", {
          select: "*",
          id: `eq.${id}`,
          limit: "1",
        })
      )[0] ?? null
    );
  }
  discussions(entityId: string) {
    return this.request<Discussion>("entity_discussion_items", {
      select: "*",
      entity_id: `eq.${entityId}`,
      order: "created_at.desc,id",
      limit: "50",
    });
  }
  notifications() {
    return this.request<Notice>("notifications", {
      select: "id,notification_type,entity_id,thread_id,read_at",
      order: "created_at.desc,id",
      limit: "50",
    });
  }
  threads() {
    return this.request<Thread>("conversation_threads", {
      select: "id,title,kind",
      order: "updated_at.desc,id",
      limit: "50",
    });
  }
  async thread(id: string) {
    return (
      (
        await this.request<Thread>("conversation_threads", {
          select: "id,title,kind",
          id: `eq.${id}`,
          limit: "1",
        })
      )[0] ?? null
    );
  }
  messages(threadId: string) {
    return this.request<Message>("messages", {
      select: "id,thread_id,sender_id,body",
      thread_id: `eq.${threadId}`,
      deleted_at: "is.null",
      order: "created_at.desc,id",
      limit: "50",
    });
  }
  async sendMessage(threadId: string, body: string, id: string) {
    if (!body.trim() || body.length > 5000)
      throw new ApiError(
        "validation",
        "Message must contain 1–5000 characters",
      );
    const row = {
      id,
      thread_id: threadId,
      sender_id: this.session().userId,
      body: body.trim(),
    };
    try {
      return (await this.request<Message>("messages", {}, "POST", row))[0];
    } catch (e) {
      if (!(e instanceof ApiError) || e.code !== "23505") throw e;
      const existing = (
        await this.request<Message>("messages", {
          id: `eq.${id}`,
          sender_id: `eq.${row.sender_id}`,
          limit: "1",
        })
      )[0];
      if (
        !existing ||
        existing.thread_id !== threadId ||
        existing.body !== row.body
      )
        throw e;
      return existing;
    }
  }
  async blockCitizen(blockedId: string): Promise<void> {
    const blockerId = this.session().userId;
    if (!blockedId || blockedId === blockerId)
      throw new ApiError("validation", "Choose another Citizen to block");
    try {
      await this.request(
        "citizen_blocks",
        {},
        "POST",
        { blocker_id: blockerId, blocked_id: blockedId },
      );
    } catch (e) {
      if (!(e instanceof ApiError) || e.code !== "23505") throw e;
      const existing = await this.request<Record<string, unknown>>(
        "citizen_blocks",
        {
          select: "blocker_id,blocked_id",
          blocker_id: `eq.${blockerId}`,
          blocked_id: `eq.${blockedId}`,
          limit: "1",
        },
      );
      if (!existing[0]) throw e;
    }
  }
  async reportMessage(
    messageId: string,
    category: string,
    details = "",
  ): Promise<Record<string, unknown>> {
    const reporterId = this.session().userId;
    const cleanCategory = category.trim();
    const cleanDetails = details.trim();
    if (!messageId || !cleanCategory)
      throw new ApiError("validation", "Choose a message and report category");
    if (cleanDetails.length > 4000)
      throw new ApiError("validation", "Report details must be 4000 characters or fewer");
    const row = (
      await this.request<Record<string, unknown>>(
        "reports",
        {},
        "POST",
        {
          reporter_id: reporterId,
          target_message_id: messageId,
          category: cleanCategory,
          details: cleanDetails || null,
        },
      )
    )[0];
    if (!row) throw new ApiError("server", "Report was not acknowledged");
    return row;
  }
  async membership(entityId: string) {
    return (
      (
        await this.request<{ status: string }>("entity_memberships", {
          select: "status",
          entity_id: `eq.${entityId}`,
          citizen_id: `eq.${this.session().userId}`,
          limit: "1",
        })
      )[0] ?? null
    );
  }
  async apply(i: OutboxItem): Promise<Record<string, unknown>> {
    const userId = this.session().userId;
    const p = i.payload;
    if(i.kind === "message.send") return {...await this.sendMessage(String(p.threadId),String(p.body),i.mutationId)};
    if (i.kind === "discussion.post") {
      if (typeof p.body !== "string" || !p.body.trim() || p.body.length > 5000)
        throw new ApiError("validation", "Post must contain 1–5000 characters");
      const body = {
        entity_id: p.entityId,
        author_id: userId,
        parent_id: p.parentId ?? null,
        body: p.body,
        provenance: "genuine",
        client_mutation_id: i.mutationId,
      };
      try {
        return (
          await this.request<Record<string, unknown>>(
            "entity_discussion_items",
            {},
            "POST",
            body,
          )
        )[0];
      } catch (e) {
        if (!(e instanceof ApiError) || e.code !== "23505") throw e;
        const row = (
          await this.request<Record<string, unknown>>(
            "entity_discussion_items",
            {
              author_id: `eq.${userId}`,
              client_mutation_id: `eq.${i.mutationId}`,
              limit: "1",
            },
          )
        )[0];
        if (
          !row ||
          row.entity_id !== p.entityId ||
          row.body !== p.body ||
          row.parent_id !== (p.parentId ?? null)
        )
          throw e;
        return row;
      }
    }
    if (i.kind === "notification.read") {
      const row = (
        await this.request<Record<string, unknown>>(
          "notifications",
          { id: `eq.${p.id}`, citizen_id: `eq.${userId}` },
          "PATCH",
          { read_at: p.readAt },
        )
      )[0];
      if (!row) throw new ApiError("authorization", "Notification unavailable");
      return row;
    }
    const filter = {
      entity_id: `eq.${p.entityId}`,
      citizen_id: `eq.${userId}`,
    };
    if (i.kind === "membership.leave") {
      await this.request("entity_memberships", filter, "DELETE");
      return { entity_id: p.entityId, status: "left" };
    }
    if (i.kind !== "membership.join")
      throw new ApiError("validation", "Unknown mutation");
    try {
      return (
        await this.request<Record<string, unknown>>(
          "entity_memberships",
          {},
          "POST",
          {
            entity_id: p.entityId,
            citizen_id: userId,
            role: "member",
            status: "active",
            provenance: "genuine",
          },
        )
      )[0];
    } catch (e) {
      if (!(e instanceof ApiError) || e.code !== "23505") throw e;
      const rows = await this.request<Record<string, unknown>>(
        "entity_memberships",
        filter,
        "PATCH",
        { status: "active" },
      );
      if (!rows[0])
        throw new ApiError("authorization", "Membership unavailable");
      return rows[0];
    }
  }
}