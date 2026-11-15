/**
 * NETIZENS LIVE admission policy.
 * This module runs only on server-derived facts. It cannot authorize tokens
 * on its own, and callers must NOT provide facts from request JSON.
 */
export type LiveAdmissionFacts = Readonly<{
  actorId: string;
  authenticated: boolean;
  anonymous: boolean;
  citizenStatus: string;
  onboardingComplete: boolean;
  entity: null | Readonly<{
    id: string;
    creatorId: string;
    visibility: string;
    status: string;
  }>;
  room: null | Readonly<{
    id: string;
    entityId: string;
    hostId: string;
    status: "scheduled" | "live" | "ended";
  }>;
  requestedRoomId: string;
  requestedEntityId: string;
  entityVisibleToActor: boolean;
  blockedBetweenActorAndHost: boolean;
  membership: null | Readonly<{ role: string; status: string }>;
  safetyApproved: boolean;
  withinRateLimit: boolean;
}>;

export type AdmissionDecision =
  | Readonly<{ allowed: false; reason: "denied" }>
  | Readonly<{ allowed: true; role: "host" | "moderator" | "viewer" }>;

/**
 * Fail closed. Only a server can call this with verified identity, RLS-filtered
 * World Entity, trusted live-room registry, safety review and rate limit.
 * Creator may host; only active authorized members may moderate.
 * Nonpublic streams require active membership even when invited to an Entity.
 */
export function decideLiveAdmission(facts: LiveAdmissionFacts): AdmissionDecision {
  const deny = { allowed: false, reason: "denied" } as const;
  const { entity, room, membership } = facts;
  if (
    !facts.authenticated ||
    facts.anonymous ||
    !facts.actorId ||
    facts.citizenStatus !== "active" ||
    !facts.onboardingComplete ||
    !facts.safetyApproved ||
    !facts.withinRateLimit ||
    !facts.entityVisibleToActor ||
    facts.blockedBetweenActorAndHost ||
    !entity ||
    entity.status !== "active" ||
    !room ||
    room.status === "ended" ||
    room.entityId !== entity.id ||
    entity.id !== facts.requestedEntityId ||
    room.id !== facts.requestedRoomId
  ) return deny;

  const isCreator = entity.creatorId === facts.actorId;
  const activeMember = membership?.status === "active";
  const privateToMembers = entity.visibility !== "public";
  if (privateToMembers && !isCreator && !activeMember) return deny;

  // No one becomes a host based only on a member-supplied role.
  if (isCreator && room.hostId === facts.actorId)
    return { allowed: true, role: "host" };

  // Until host delegation has its own review, non-creators cannot host.
  if (room.hostId !== entity.creatorId) return deny;
  if (room.status !== "live") return deny;

  if (
    activeMember &&
    (membership.role === "moderator" || membership.role === "admin" ||
      membership.role === "owner" || membership.role === "organizer")
  ) return { allowed: true, role: "moderator" };

  if (membership?.status === "muted" || membership?.status === "removed") return deny;
  return { allowed: true, role: "viewer" };
}
