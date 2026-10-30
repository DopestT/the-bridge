import { loadCached } from "./world-model";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import type { Entity } from "../../api/netizens-repository";
import { ParticipationPanel } from "../participation/ParticipationPanel";
import { YesNoPanel } from "../participation/YesNoPanel";
import { EntityChildren } from "./EntityChildren";
export function EntityScreen({ entityId }: { entityId: string }) {
  return <EntityContent key={entityId} entityId={entityId} />;
}
function EntityContent({ entityId }: { entityId: string }) {
  const runtime = useRuntime(),
    router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null),
    [loading, setLoading] = useState(true),
    [opening, setOpening] = useState(false),
    [conversationError, setConversationError] = useState("");
  async function openConversation() {
    if (opening) return;
    setOpening(true); setConversationError("");
    try {
      const thread = await runtime.repository.threadForEntity(entityId);
      if (thread) router.push(`/messages/${thread.id}`);
      else setConversationError("No conversation is available for this Circle, or you do not have access.");
    } catch { setConversationError("Conversation unavailable. Reconnect and try again."); }
    finally { setOpening(false); }
  }
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
            <EntityChildren key={entity.id} parent={entity} />
            {entity.place_id === "circles" ? (
              <>
                <Text style={styles.text}>
                  This Circle uses private conversations.
                </Text>
                <Button
                  title="Open Messages"
                  disabled={opening}
                  onPress={() => void openConversation()}
                />
                {conversationError ? <Text style={styles.text} accessibilityRole="alert">{conversationError}</Text> : null}
              </>
            ) : entity.place_id === "yesno" ? (
              <YesNoPanel key={entity.id} entityId={entity.id} />
            ) : (
              <ParticipationPanel key={entity.id} entity={entity} />
            )}
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}
