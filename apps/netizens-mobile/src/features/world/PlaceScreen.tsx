import { loadCached } from "./world-model";
import { useEffect, useState } from "react";
import { Button, FlatList, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import type { Entity } from "../../api/netizens-repository";
import { LocalScreen } from "../local/LocalScreen";
export function PlaceScreen({ placeId }: { placeId: string }) {
  return <PlaceContent key={placeId} placeId={placeId} />;
}
function PlaceContent({ placeId }: { placeId: string }) {
  const runtime = useRuntime(),
    router = useRouter();
  const [rows, setRows] = useState<Entity[]>([]),
    [error, setError] = useState(""),
    [offset, setOffset] = useState(0),
    [more, setMore] = useState(false);
  useEffect(() => {
    let live = true;
    const key = `place:${placeId}:${offset}`;
    void loadCached<Entity[]>({
      cached: async () =>
        (await runtime.projections.get<Entity[]>("entities", key))?.body ??
        null,
      refresh: () => runtime.repository.entities(placeId, offset),
      save: (data) =>
        runtime.projections.put(
          "entities",
          key,
          data.filter(
            (e) => e.visibility === "public" && e.place_id !== "circles",
          ),
        ),
      clear: () => runtime.projections.remove("entities", key),
      emit: (s) => {
        if (live) {
          setRows(s.data ?? []);
          setMore(s.phase === "ready" && (s.data?.length ?? 0) === 50);
          setError(
            s.phase === "offlineCached"
              ? "Offline — showing saved spaces"
              : s.phase === "unavailable" || s.phase === "unauthorized"
                ? "This place is unavailable. Reconnect or sign in again."
                : "",
          );
        }
      },
    });
    return () => {
      live = false;
    };
  }, [
    placeId,
    offset,
    runtime.repository,
    runtime.projections,
    runtime.revision,
  ]);
  return (
    <AppShell title={placeId} breadcrumb={["World"]}>
      <Text style={styles.text}>{error}</Text>
      {placeId === "local" ? <LocalScreen /> : null}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={
          <Text style={styles.text}>No spaces to show yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={styles.card}
            onPress={() => router.push(`/entity/${item.id}`)}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.summary}</Text>
          </Pressable>
        )}
      />
      {offset > 0 ? (
        <Button
          title="Previous spaces"
          onPress={() => setOffset(Math.max(0, offset - 50))}
        />
      ) : null}
      {more ? (
        <Button title="More spaces" onPress={() => setOffset(offset + 50)} />
      ) : null}
    </AppShell>
  );
}
