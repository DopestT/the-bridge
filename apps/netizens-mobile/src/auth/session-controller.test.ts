import { SessionController } from './session-controller';
import type { SessionStore, StoredSession } from './types';

function memoryStore(initial: StoredSession | null = null): SessionStore & { current(): StoredSession | null } {
  let value = initial;
  return {
    async read() { return value; },
    async write(next) { value = next; },
    async clear() { value = null; },
    current() { return value; },
  };
}

const NOW = 2_000_000;
const valid: StoredSession = {
  accessToken: 'a',
  refreshToken: 'r',
  expiresAt: NOW + 60_000,
  userId: 'u1',
  isAnonymous: false,
};

describe('SessionController', () => {
  test('restores a permanent Citizen and allows protected writes', async () => {
    const store = memoryStore(valid);
    const controller = new SessionController(store, { refresh: async () => null }, () => NOW);
    await expect(controller.restore()).resolves.toBe('authenticated');
    expect(controller.requireWriteSession().accessToken).toBe('a');
  });

  test('rejects anonymous auth users from NETIZENS World', async () => {
    const store = memoryStore({ ...valid, isAnonymous: true });
    const controller = new SessionController(store, { refresh: async () => null }, () => NOW);
    await expect(controller.restore()).resolves.toBe('anonymous');
    expect(store.current()).toBeNull();
    expect(() => controller.requireWriteSession()).toThrow('authenticated permanent Citizen');
  });

  test('keeps cached reads available while expired writes wait for refresh', async () => {
    const store = memoryStore({ ...valid, expiresAt: NOW - 1 });
    const refreshed = { ...valid, accessToken: 'fresh' };
    const controller = new SessionController(store, { refresh: async () => refreshed }, () => NOW);
    await expect(controller.restore()).resolves.toBe('expired');
    expect(controller.canUseCachedReads()).toBe(true);
    expect(() => controller.requireWriteSession()).toThrow('authenticated permanent Citizen');
    await expect(controller.refresh()).resolves.toBe('authenticated');
    expect(controller.requireWriteSession().accessToken).toBe('fresh');
  });

  test('logout clears sensitive session material', async () => {
    const store = memoryStore(valid);
    const controller = new SessionController(store, { refresh: async () => null }, () => NOW);
    await controller.restore();
    await controller.logout();
    expect(store.current()).toBeNull();
    expect(controller.state).toBe('unknown');
  });
});
