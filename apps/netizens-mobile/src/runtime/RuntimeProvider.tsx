import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState, Button, Text, TextInput, View } from "react-native";
import { randomUUID } from "expo-crypto";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseClient } from "../api/supabase";
import { NetizensRepository } from "../api/netizens-repository";
import { readPublicEnv } from "../config/env";
import { secureSessionStore } from "../auth/secure-session";
import { SessionController } from "../auth/session-controller";
import { openNetizensDatabase } from "../storage/database";
import { ProjectionStore } from "../storage/projections";
import { Outbox } from "../sync/outbox";
import { Reconciler } from "../sync/reconciler";
import { AppShell } from "../components/AppShell";
import { styles } from "../components/mobile-styles";
export type Runtime = {
  repository: NetizensRepository;
  projections: ProjectionStore;
  outbox: Outbox;
  revision: number;
  sync: () => Promise<void>;
  logout: () => Promise<void>;
  userId: string;
};
const Context = createContext<Runtime | null>(null);
export function useRuntime() {
  const value = useContext(Context);
  if (!value) throw new Error("Sign in required");
  return value;
}
function stored(s: Session) {
  return {
    accessToken: s.access_token,
    refreshToken: s.refresh_token,
    expiresAt: (s.expires_at ?? 0) * 1000,
    userId: s.user.id,
    isAnonymous: !!s.user.is_anonymous,
  };
}
export function RuntimeProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<Runtime | null>(null),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [epoch, setEpoch] = useState(0);
  useEffect(() => {
    let active = true,
      cleanup = () => {};
    async function boot() {
      const client = createSupabaseClient();
      const env = readPublicEnv();
      const controller = new SessionController(secureSessionStore, {
        refresh: async (s) => {
          const { data, error } = await client.auth.refreshSession({
            refresh_token: s.refreshToken,
          });
          if (error || !data.session) return null;
          return stored(data.session);
        },
      });
      await controller.restore();
      let saved = await secureSessionStore.read();
      if (controller.state === "expired") {
        try {
          await controller.refresh();
          saved = await secureSessionStore.read();
        } catch {
          /* Cached public reads may still work offline. */
        }
      }
      if (!saved || saved.isAnonymous) return;
      const db = await openNetizensDatabase();
      if (!active) return;
      const projections = new ProjectionStore(db, saved.userId);
      const outbox = new Outbox(db, saved.userId, Date.now, randomUUID);
      const current = () => {
        if (!active) throw new Error("Session closed");
        return controller.requireWriteSession();
      };
      const repository = new NetizensRepository(
        env.supabaseUrl,
        env.supabasePublishableKey,
        current,
      );
      const reconciler = new Reconciler(
        outbox,
        repository,
        projections,
        current,
      );
      const sync = async () => {
        try {
          for (let i = 0; i < 20; i++) {
            const result = await reconciler.syncOnce();
            if (!result.applied) break;
          }
          if (active)
            setRuntime((r) => (r ? { ...r, revision: r.revision + 1 } : null));
        } catch {
          if (active)
            setError("Sync paused. Your pending actions remain saved.");
        }
      };
      const logout = async () => {
        active = false;
        setReady(false);
        setRuntime(null);
        cleanup();
        await controller.logout();
        await reconciler.whenIdle();
        await projections.clearAccount();
        setEpoch((e) => e + 1);
      };
      setRuntime({
        repository,
        projections,
        outbox,
        revision: 0,
        sync,
        logout,
        userId: saved.userId,
      });
      const resume = async () => {
        try {
          await controller.refresh();
        } catch {
          /* writes remain paused on expired session */
        }
        if (active) await sync();
      };
      const timer = setInterval(() => void resume(), 30000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void resume();
      });
      cleanup = () => {
        clearInterval(timer);
        subscription.remove();
      };
      void sync();
    }
    void boot()
      .catch(() => {
        if (active)
          setError(
            "Unable to start. Check the app configuration and your connection.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      cleanup();
    };
  }, [epoch]);
  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const client = createSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session || data.user?.is_anonymous)
        throw new Error("Sign-in failed. Check your email and password.");
      await secureSessionStore.write(stored(data.session));
      setPassword("");
      setReady(false);
      setEpoch((e) => e + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  if (runtime)
    return <Context.Provider value={runtime}>{children}</Context.Provider>;
  return (
    <AppShell title="NETIZENS">
      <Text style={styles.text}>One network, many places.</Text>
      <Text style={styles.text}>
        {ready
          ? "Sign in with your Citizen account."
          : "Restoring your session…"}
      </Text>
      {ready ? (
        <View>
          <TextInput
            style={styles.input}
            accessibilityLabel="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            accessibilityLabel="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button
            title={busy ? "Signing in…" : "Sign in"}
            disabled={busy}
            onPress={() => void signIn()}
          />
        </View>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.text}>
          {error}
        </Text>
      ) : null}
    </AppShell>
  );
}
