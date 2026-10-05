import { parseNetizensUrl, routeToHref } from './routes';

describe('NETIZENS mobile route contract', () => {
  test('parses the initial routes and custom scheme', () => {
    expect(parseNetizensUrl('/world')).toEqual({ kind: 'world' });
    expect(parseNetizensUrl('/place/crew_1')).toEqual({ kind: 'place', placeId: 'crew_1' });
    expect(parseNetizensUrl('/entity/entity-1')).toEqual({ kind: 'entity', entityId: 'entity-1' });
    expect(parseNetizensUrl('/search')).toEqual({ kind: 'search' });
    expect(parseNetizensUrl('/messages')).toEqual({ kind: 'messages' });
    expect(parseNetizensUrl('/messages/thread_1')).toEqual({ kind: 'thread', threadId: 'thread_1' });
    expect(parseNetizensUrl('/notifications')).toEqual({ kind: 'notifications' });
    expect(parseNetizensUrl('/profile')).toEqual({ kind: 'profile' });
    expect(parseNetizensUrl('netizens://entity/entity-2')).toEqual({ kind: 'entity', entityId: 'entity-2' });
  });

  test('rejects malformed identifiers and returns descriptors only', () => {
    expect(parseNetizensUrl('/entity/../secret')).toBeNull();
    expect(parseNetizensUrl('/messages/thread%2Fsecret')).toBeNull();
    const descriptor = parseNetizensUrl('netizens://messages/thread_42');
    expect(descriptor).toEqual({ kind: 'thread', threadId: 'thread_42' });
    expect(descriptor).not.toHaveProperty('body');
  });

  test('serializes descriptors to stable hrefs', () => {
    expect(routeToHref({ kind: 'world' })).toBe('/world');
    expect(routeToHref({ kind: 'place', placeId: 'crew_1' })).toBe('/place/crew_1');
    expect(routeToHref({ kind: 'entity', entityId: 'entity-1' })).toBe('/entity/entity-1');
    expect(routeToHref({ kind: 'thread', threadId: 'thread_1' })).toBe('/messages/thread_1');
  });
});
