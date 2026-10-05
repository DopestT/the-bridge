export type NetizensRoute =
  | { kind: 'world' }
  | { kind: 'place'; placeId: string }
  | { kind: 'entity'; entityId: string }
  | { kind: 'search' }
  | { kind: 'messages' }
  | { kind: 'thread'; threadId: string }
  | { kind: 'notifications' }
  | { kind: 'profile' };

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

function safeId(value: string | undefined): string | null {
  if (!value) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  return SAFE_ID.test(decoded) ? decoded : null;
}

function pathFromInput(input: string): string | null {
  if (input.startsWith('/')) return input;
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== 'netizens:') return null;
    return `/${parsed.host}${parsed.pathname}`;
  } catch {
    return null;
  }
}

export function parseNetizensUrl(input: string): NetizensRoute | null {
  const path = pathFromInput(input);
  if (!path) return null;
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 1) {
    switch (segments[0]) {
      case 'world': return { kind: 'world' };
      case 'search': return { kind: 'search' };
      case 'messages': return { kind: 'messages' };
      case 'notifications': return { kind: 'notifications' };
      case 'profile': return { kind: 'profile' };
      default: return null;
    }
  }

  if (segments.length !== 2) return null;
  const id = safeId(segments[1]);
  if (!id) return null;

  switch (segments[0]) {
    case 'place': return { kind: 'place', placeId: id };
    case 'entity': return { kind: 'entity', entityId: id };
    case 'messages': return { kind: 'thread', threadId: id };
    default: return null;
  }
}

export function routeToHref(route: NetizensRoute): string {
  switch (route.kind) {
    case 'world': return '/world';
    case 'place': return `/place/${encodeURIComponent(route.placeId)}`;
    case 'entity': return `/entity/${encodeURIComponent(route.entityId)}`;
    case 'search': return '/search';
    case 'messages': return '/messages';
    case 'thread': return `/messages/${encodeURIComponent(route.threadId)}`;
    case 'notifications': return '/notifications';
    case 'profile': return '/profile';
  }
}
