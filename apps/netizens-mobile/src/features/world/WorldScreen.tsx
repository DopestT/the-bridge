import { useEffect, useState } from "react";
import { Button, FlatList, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import { loadCached, type ReadState } from "./world-model";
import type { Place } from "../../api/netizens-repository";
export function WorldScreen() {
  const runtime = useRuntime(),
    router = useRouter();
  const [state, setState] = useState<ReadState<Place[]>>({
    phase: "neverLoaded",
    data: null,
  });
  useEffect(() => {
    let live = true;
    void loadCached({
      cached: async () =>
        (await runtime.projections.get<Place[]>("places", "world"))?.body ??
        null,
      refresh: () => runtime.repository.places(),
      save: (data) => runtime.projections.put("places", "world", data),
      clear: () => runtime.projections.remove("places", "world"),
      emit: (s) => {
        if (live) setState(s);
      },
    });
    return () => {
      live = false;
    };
  }, [runtime.repository, runtime.projections, runtime.revision]);
  return (
    <AppShell title="World">
      <Text style={styles.text}>What do you want to do?</Text>
      <Text style={styles.muted}>
        {state.phase === "offlineCached"
          ? "Offline — showing saved places"
          : state.phase === "neverLoaded"
            ? "Loading places…"
            : ""}
      </Text>
      <FlatList
        data={state.data ?? []}
        keyExtractor={(p) => p.id}
        ListEmptyComponent={
          <Text style={styles.text}>
            No places available. Check your connection or sign in again.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            accessibilityRole="button"
            onPress={() => router.push(`/place/${item.id}`)}
          >
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.text}>{item.purpose}</Text>
          </Pressable>
        )}
      />
      <Button title="Refresh" onPress={() => void runtime.sync()} />
    </AppShell>
  );
}
