import type {
  SessionRefreshGateway,
  SessionState,
  SessionStore,
  StoredSession,
} from "./types";

export class SessionController {
  state: SessionState = "unknown";
  private session: StoredSession | null = null;
  private generation = 0;
  private storageQueue: Promise<void> = Promise.resolve();
  private refreshInFlight: Promise<SessionState> | null = null;

  private serialize(work: () => Promise<void>): Promise<void> {
    const next = this.storageQueue.then(work, work);
    this.storageQueue = next.catch(() => undefined);
    return next;
  }
  private readonly store: SessionStore;
  private readonly gateway: SessionRefreshGateway;
  private readonly now: () => number;

  constructor(
    store: SessionStore,
    gateway: SessionRefreshGateway,
    now: () => number = () => Date.now(),
  ) {
    this.store = store;
    this.gateway = gateway;
    this.now = now;
  }

  async restore(): Promise<SessionState> {
    const generation = this.generation;
    const session = await this.store.read();
    if (generation !== this.generation) return this.state;
    this.session = session;
    if (!session) return (this.state = "unknown");
    if (session.isAnonymous) {
      await this.store.clear();
      this.session = null;
      return (this.state = "anonymous");
    }
    if (session.expiresAt <= this.now()) return (this.state = "expired");
    return (this.state = "authenticated");
  }

  async refresh(): Promise<SessionState> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const operation = this.refreshCurrent();
    this.refreshInFlight = operation;
    try {
      return await operation;
    } finally {
      this.refreshInFlight = null;
    }
  }

  private async refreshCurrent(): Promise<SessionState> {
    if (!this.session) return (this.state = "unknown");
    const generation = this.generation;
    const refreshed = await this.gateway.refresh(this.session);
    if (generation !== this.generation) return this.state;
    if (!refreshed) return (this.state = "expired");
    await this.serialize(async () => {
      if (generation !== this.generation) return;
      if (refreshed.isAnonymous) {
        await this.store.clear();
        if (generation === this.generation) {
          this.session = null;
          this.state = "anonymous";
        }
        return;
      }
      await this.store.write(refreshed);
      if (generation !== this.generation) return;
      this.session = refreshed;
      this.state =
        refreshed.expiresAt <= this.now() ? "expired" : "authenticated";
    });
    return this.state;
  }

  requireWriteSession(): StoredSession {
    if (
      this.state !== "authenticated" ||
      !this.session ||
      this.session.isAnonymous ||
      this.session.expiresAt <= this.now()
    ) {
      throw new Error(
        "Protected writes require an authenticated permanent Citizen",
      );
    }
    return this.session;
  }

  canUseCachedReads(): boolean {
    return true;
  }

  // Retire an unmounted runtime without clearing credentials that a replacement
  // runtime may already own. In-flight refreshes must not persist their result.
  retire(): void {
    this.generation++;
    this.session = null;
    this.state = "unknown";
  }

  async logout(): Promise<void> {
    this.generation++;
    this.session = null;
    this.state = "unknown";
    await this.serialize(() => this.store.clear());
  }
}
