import * as SecureStore from 'expo-secure-store';
import type { SessionStore, StoredSession } from './types';

const KEYS = {
  accessToken: 'netizens.session.access',
  refreshToken: 'netizens.session.refresh',
  expiresAt: 'netizens.session.expiresAt',
  userId: 'netizens.session.userId',
  isAnonymous: 'netizens.session.isAnonymous',
} as const;

export const secureSessionStore: SessionStore = {
  async read(): Promise<StoredSession | null> {
    const [accessToken, refreshToken, expiresAt, userId, isAnonymous] = await Promise.all([
      SecureStore.getItemAsync(KEYS.accessToken),
      SecureStore.getItemAsync(KEYS.refreshToken),
      SecureStore.getItemAsync(KEYS.expiresAt),
      SecureStore.getItemAsync(KEYS.userId),
      SecureStore.getItemAsync(KEYS.isAnonymous),
    ]);

    if (!accessToken || !refreshToken || !expiresAt || !userId || isAnonymous === null) return null;
    const expiresAtNumber = Number(expiresAt);
    if (!Number.isFinite(expiresAtNumber)) return null;

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAtNumber,
      userId,
      isAnonymous: isAnonymous === '1',
    };
  },

  async write(session: StoredSession): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, session.accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken),
      SecureStore.setItemAsync(KEYS.expiresAt, String(session.expiresAt)),
      SecureStore.setItemAsync(KEYS.userId, session.userId),
      SecureStore.setItemAsync(KEYS.isAnonymous, session.isAnonymous ? '1' : '0'),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)));
  },
};
