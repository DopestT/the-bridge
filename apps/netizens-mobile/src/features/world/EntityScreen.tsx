import { loadCached } from "./world-model";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import type { Entity } from "../../api/netizens-repository";
import { ParticipationPanel } from "../participation/ParticipationPanel";
export function EntityScreen({ entityId }: { entityId: string }) {
  return <EntityContent key={entityId} entityId={entityId} />;
}
function EntityContent({ entityId }: { entityId: string }) {
  const runtime = useRuntime(),
    router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    void loadCached<Entity>({
      cached: async () => {
        const row = await runtime.projections.get<Entity>("entities", entityId);
        return row?.body.visibility === "public" &&
          row.body.place_id !== "circles"
          ? row.body
          : null;
      },
      refresh: () => runtime.repository.entity(entityId),
      save: async (data) => {
        if (data.visibility === "public" && data.place_id !== "circles")
          await runtime.projections.put("entities", entityId, data);
        else await runtime.projections.remove("entities", entityId);
      },
      clear: () => runtime.projections.remove("entities", entityId),
      emit: (s) => {
        if (live) {
          setEntity(s.data);
          setLoading(s.phase === "neverLoaded");
        }
      },
    });
    return () => {
      live = false;
    };
  }, [entityId, runtime.repository, runtime.projections]);
  return (
    <AppShell
      title={entity?.title ?? "Space"}
      breadcrumb={["World", entity?.place_id ?? ""]}
    >
      <ScrollView>
        {loading ? (
          <Text style={styles.text}>Loading space…</Text>
        ) : !entity ? (
          <Text style={styles.text}>
            This space is unavailable or you do not have access.
          </Text>
        ) : (
          <>
            <Text style={styles.text}>{entity.summary}</Text>
            {entity.place_id === "circles" ? (
              <>
                <Text style={styles.text}>
                  This Circle uses private conversations.
                </Text>
                <Button
                  title="Open Messages"
                  onPress={() => router.push("/messages")}
                />
              </>
            ) : (
              <ParticipationPanel key={entity.id} entity={entity} />
            )}
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}
