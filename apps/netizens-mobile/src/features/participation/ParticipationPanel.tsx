import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { styles } from "../../components/mobile-styles";
import type { Entity, Discussion } from "../../api/netizens-repository";
import type { PendingAction } from "../../sync/types";
import { participate } from "./participation-service";
export function ParticipationPanel({ entity }: { entity: Entity }) {
  const runtime = useRuntime();
  const [posts, setPosts] = useState<Discussion[]>([]),
    [body, setBody] = useState(""),
    [parent, setParent] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [pending, setPending] = useState<PendingAction[]>([]),
    [busy, setBusy] = useState(false),
    [joined, setJoined] = useState(false);
  useEffect(() => {
    let live = true;
    void runtime.outbox
      .list("entityId", entity.id)
      .then((rows) => {
        if (live) setPending(rows);
      })
      .catch(() => {
        if (live) setNotice("Unable to read saved actions.");
      });
    void Promise.all([
      runtime.repository.discussions(entity.id),
      runtime.repository.membership(entity.id),
    ])
      .then(([data, member]) => {
        if (live) {
          setPosts(data);
          setJoined(member?.status === "active");
        }
      })
      .catch(() => {
        if (live) setNotice("Reconnect to refresh the discussion.");
      });
    return () => {
      live = false;
    };
  }, [entity.id, runtime.repository, runtime.outbox, runtime.revision]);
  const membership = pending
    .filter((p) => p.status !== "rejected" && p.kind.startsWith("membership."))
    .at(-1);
  const shownJoined = membership
    ? membership.kind === "membership.join"
    : joined;
  async function act(
    kind: "membership.join" | "membership.leave" | "discussion.post",
  ) {
    setBusy(true);
    try {
      await participate(
        runtime,
        entity,
        kind,
        kind === "discussion.post"
          ? { body: body.trim(), parentId: parent }
          : {},
      );
      setPending(await runtime.outbox.list("entityId", entity.id));
      setNotice("");
      if (kind === "discussion.post") {
        setBody("");
        setParent(null);
      }
      void runtime.sync();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View>
      <Button
        title={shownJoined ? "Leave" : "Join"}
        disabled={busy}
        onPress={() =>
          void act(shownJoined ? "membership.leave" : "membership.join")
        }
      />
      {notice ? (
        <Text accessibilityRole="alert" style={styles.text}>
          {notice}
        </Text>
      ) : null}
      {pending.map((p) => (
        <View key={p.mutationId} style={styles.card}>
          <Text style={styles.muted}>
            {p.status === "rejected"
              ? "Not accepted — this action was rolled back."
              : "Pending — saved on this device"}
          </Text>
          <Text style={styles.text}>
            {String(
              p.payload.body ??
                (p.kind === "membership.join" ? "Join space" : "Leave space"),
            )}
          </Text>
        </View>
      ))}
      {posts
        .filter(
          (p) =>
            !pending.some((item) => item.mutationId === p.client_mutation_id),
        )
        .map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.muted}>
              {p.provenance === "genuine"
                ? "Citizen"
                : `${p.provenance} example`}
              {p.parent_id ? " · Reply" : ""}
            </Text>
            <Text style={styles.text}>{p.body}</Text>
            <Button title="Reply" onPress={() => setParent(p.id)} />
          </View>
        ))}
      {parent ? (
        <>
          <Text style={styles.text}>Replying to selected post</Text>
          <Button title="Cancel reply" onPress={() => setParent(null)} />
        </>
      ) : null}
      <TextInput
        accessibilityLabel="Write a post"
        style={styles.input}
        multiline
        maxLength={5000}
        value={body}
        onChangeText={setBody}
      />
      <Button
        title="Post"
        disabled={busy || !body.trim()}
        onPress={() => void act("discussion.post")}
      />
    </View>
  );
}
