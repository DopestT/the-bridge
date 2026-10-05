export type SessionState = 'unknown' | 'anonymous' | 'authenticated' | 'expired';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  isAnonymous: boolean;
};

export interface SessionStore {
  read(): Promise<StoredSession | null>;
  write(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
}

export interface SessionRefreshGateway {
  refresh(session: StoredSession): Promise<StoredSession | null>;
}
