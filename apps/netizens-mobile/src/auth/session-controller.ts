import type { SessionRefreshGateway, SessionState, SessionStore, StoredSession } from './types';

export class SessionController {
  state: SessionState = 'unknown';
  private session: StoredSession | null = null;
  private readonly store: SessionStore;
  private readonly gateway: SessionRefreshGateway;
  private readonly now: () => number;

  constructor(store: SessionStore, gateway: SessionRefreshGateway, now: () => number = () => Date.now()) {
    this.store = store;
    this.gateway = gateway;
    this.now = now;
  }

  async restore(): Promise<SessionState> {
    const session = await this.store.read();
    this.session = session;
    if (!session) return (this.state = 'unknown');
    if (session.isAnonymous) {
      await this.store.clear();
      this.session = null;
      return (this.state = 'anonymous');
    }
    if (session.expiresAt <= this.now()) return (this.state = 'expired');
    return (this.state = 'authenticated');
  }

  async refresh(): Promise<SessionState> {
    if (!this.session) return (this.state = 'unknown');
    const refreshed = await this.gateway.refresh(this.session);
    if (!refreshed) return (this.state = 'expired');
    if (refreshed.isAnonymous) {
      await this.store.clear();
      this.session = null;
      return (this.state = 'anonymous');
    }
    this.session = refreshed;
    await this.store.write(refreshed);
    return (this.state = refreshed.expiresAt <= this.now() ? 'expired' : 'authenticated');
  }

  requireWriteSession(): StoredSession {
    if (this.state !== 'authenticated' || !this.session || this.session.isAnonymous || this.session.expiresAt <= this.now()) {
      throw new Error('Protected writes require an authenticated permanent Citizen');
    }
    return this.session;
  }

  canUseCachedReads(): boolean {
    return true;
  }

  async logout(): Promise<void> {
    await this.store.clear();
    this.session = null;
    this.state = 'unknown';
  }
}
