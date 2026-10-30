import { isAccountErased, markAccountErased } from './account-erasure';
import * as SecureStore from 'expo-secure-store';
import type { SessionStore, StoredSession } from './types';

const KEYS = {
  accessToken: 'netizens.session.access',
  refreshToken: 'netizens.session.refresh',
  expiresAt: 'netizens.session.expiresAt',
  userId: 'netizens.session.userId',
  isAnonymous: 'netizens.session.isAnonymous',
} as const;

// Serialize this shared store across replacement runtime controllers.
let storageQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const operation = storageQueue.then(work, work);
  storageQueue = operation.catch(() => undefined);
  return operation;
}
async function clearKeys() {
  await Promise.all(Object.values(KEYS).map(key => SecureStore.deleteItemAsync(key)));
}
export const secureSessionStore: SessionStore & { eraseAccount(userId: string): Promise<void> } = {
  read(): Promise<StoredSession | null> {
    return serialize(async () => {
    const [accessToken, refreshToken, expiresAt, userId, isAnonymous] = await Promise.all([
      SecureStore.getItemAsync(KEYS.accessToken),
      SecureStore.getItemAsync(KEYS.refreshToken),
      SecureStore.getItemAsync(KEYS.expiresAt),
      SecureStore.getItemAsync(KEYS.userId),
      SecureStore.getItemAsync(KEYS.isAnonymous),
    ]);

    if (!accessToken || !refreshToken || !expiresAt || !userId || isAccountErased(userId) || isAnonymous === null) return null;
    const expiresAtNumber = Number(expiresAt);
    if (!Number.isFinite(expiresAtNumber)) return null;

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAtNumber,
      userId,
      isAnonymous: isAnonymous === '1',
    };
    });
  },

  write(session: StoredSession): Promise<void> {
    return serialize(async () => {
    if (isAccountErased(session.userId)) throw new Error("Deleted account credentials cannot be restored");
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, session.accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken),
      SecureStore.setItemAsync(KEYS.expiresAt, String(session.expiresAt)),
      SecureStore.setItemAsync(KEYS.userId, session.userId),
      SecureStore.setItemAsync(KEYS.isAnonymous, session.isAnonymous ? '1' : '0'),
    ]);
    });
  },

  clear(): Promise<void> { return serialize(clearKeys); },
  eraseAccount(userId: string): Promise<void> {
    markAccountErased(userId);
    return serialize(async () => {
      if (await SecureStore.getItemAsync(KEYS.userId) === userId) await clearKeys();
    });
  },
};
