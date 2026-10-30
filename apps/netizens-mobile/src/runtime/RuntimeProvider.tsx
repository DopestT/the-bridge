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
import { CitizenProfiles, type Citizen, type ProfileInput } from "../api/citizen-profile";
import { CitizenProfileForm } from "../features/profile/CitizenProfileForm";
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
  citizen: Citizen | null;
  saveProfile: (input: ProfileInput) => Promise<Citizen>;
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
    [notice, setNotice] = useState(""),
    [ready, setReady] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [profileReady, setProfileReady] = useState(false),
    [epoch, setEpoch] = useState(0);
  useEffect(() => {
    let active = true,
      cleanup = () => {},
      retire = () => {};
    async function boot() {
      setProfileReady(false);
      const client = createSupabaseClient();
      const env = readPublicEnv();
      const controller = new SessionController(secureSessionStore, {
        refresh: async (s) => {
          const { data, error } = await client.auth.refreshSession({
            refresh_token: s.refreshToken,
          });
          if (!active) throw new Error("Session closed");
          if (error || !data.session) return null;
          return stored(data.session);
        },
      });
      retire = () => controller.retire();
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
      const currentAuth = () => {
        if (!active) throw new Error("Session closed");
        return controller.requireWriteSession();
      };
      const profiles = new CitizenProfiles(env, currentAuth);
      let citizen: Citizen | null = null;
      let profileVersion = 0, profileSaving = false, resuming = false;
      try {
        citizen = await profiles.read();
        if (!active) return;
        if (citizen) await projections.put("citizens", saved.userId, citizen);
        else await projections.remove("citizens", saved.userId);
        setProfileReady(true);
      } catch {
        // A previously completed identity may render cached public data offline.
        // Every remote operation still needs a valid session and server RLS.
        const cached = await projections.get<Citizen>("citizens", saved.userId);
        if (!active) return;
        citizen = cached?.body.id === saved.userId && cached.body.status === "active"
          && cached.body.onboarding_completed_at ? cached.body : null;
        setProfileReady(!!citizen);
        setError("Citizen profile unavailable. Reconnect to verify your account.");
      }
      const current = () => {
        const session = currentAuth();
        if (!citizen || citizen.status !== "active" || !citizen.onboarding_completed_at)
          throw new Error("Complete an active Citizen profile to continue");
        return session;
      };
      const saveProfile = async (input: ProfileInput) => {
        if (profileSaving) throw new Error("A profile save is already in progress.");
        profileSaving = true;
        profileVersion++;
        try {
          const updated = await profiles.save(input);
          if (!active) throw new Error("Session closed");
          citizen = updated;
          await projections.put("citizens", saved!.userId, updated);
          if (!active) throw new Error("Session closed");
          setRuntime(r => r ? { ...r, citizen: updated } : null);
          setError("");
          return updated;
        } finally { profileSaving = false; }
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
        citizen,
        saveProfile,
      });
      const resume = async () => {
        if (resuming || !active) return;
        resuming = true;
        try {
          try { await controller.refresh(); }
          catch { /* writes remain paused on expired session */ }
          if (!active) return;
          if (!profileSaving) {
            const version = profileVersion;
            try {
              const updated = await profiles.read();
              if (!active || profileSaving || version !== profileVersion) return;
              citizen = updated;
              if (updated) await projections.put("citizens", saved!.userId, updated);
              else await projections.remove("citizens", saved!.userId);
              if (!active || profileSaving || version !== profileVersion) return;
              setRuntime(r => r ? { ...r, citizen: updated } : null);
              setProfileReady(true);
            } catch { /* Cached public reads survive a connection failure. */ }
          }
          if (active && citizen?.status === "active" && citizen.onboarding_completed_at) await sync();
        } finally { resuming = false; }
      };
      const timer = setInterval(() => void resume(), 30000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void resume();
      });
      cleanup = () => {
        clearInterval(timer);
        subscription.remove();
      };
      if (citizen?.status === "active" && citizen.onboarding_completed_at) void sync();
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
      retire();
      cleanup();
    };
  }, [epoch]);
  async function signIn() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
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
  async function signUp() {
    if (busy) return;
    setError(""); setNotice("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 12) {
      setError("Enter a valid email and a password of at least 12 characters.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await createSupabaseClient().auth.signUp({ email: email.trim(), password });
      if (error || !data.user || data.user.is_anonymous)
        throw new Error("Unable to create this account. Check your details or contact NETIZENS support.");
      setPassword("");
      if (data.session) {
        await secureSessionStore.write(stored(data.session));
        setReady(false); setEpoch(e => e + 1);
      } else setNotice("Check your email to confirm your account, then return here to sign in.");
    } catch (e) { setError(e instanceof Error ? e.message : "Account creation unavailable."); }
    finally { setBusy(false); }
  }
  if (runtime) {
    if (!profileReady) return <AppShell title="Citizen account">
      <Text style={styles.text} accessibilityRole="alert">{error || "Reconnect to verify your Citizen account."}</Text>
      <Button title="Retry account verification" onPress={() => { setReady(false); setRuntime(null); setEpoch(e => e + 1); }} />
      <Button title="Sign out" onPress={() => void runtime.logout()} />
    </AppShell>;
    if (runtime.citizen && runtime.citizen.status !== "active") return <AppShell title="Citizen account">
      <Text style={styles.text}>This account cannot enter World. Contact the NETIZENS operator for account support.</Text>
      <Button title="Sign out" onPress={() => void runtime.logout()} />
    </AppShell>;
    if (!runtime.citizen?.onboarding_completed_at) return <AppShell title="Become a Citizen">
      <CitizenProfileForm citizen={runtime.citizen} onSave={runtime.saveProfile} onboarding />
      <Button title="Sign out" onPress={() => void runtime.logout()} />
    </AppShell>;
    return <Context.Provider value={runtime}>{children}</Context.Provider>;
  }
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
          <Button title="Create Citizen account" disabled={busy} onPress={() => void signUp()} />
        </View>
      ) : null}
      {notice ? <Text style={styles.text} accessibilityLiveRegion="polite">{notice}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.text}>
          {error}
        </Text>
      ) : null}
    </AppShell>
  );
}
