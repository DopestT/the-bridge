import { useEffect, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import type { Message, Thread } from "../../api/netizens-repository";
import type { PendingAction } from "../../sync/types";
export function ThreadScreen({ threadId }: { threadId: string }) {
  return <ThreadContent key={threadId} threadId={threadId} />;
}
function ThreadContent({ threadId }: { threadId: string }) {
  const r = useRuntime();
  const [thread, setThread] = useState<Thread | null>(null),
    [rows, setRows] = useState<Message[]>([]),
    [body, setBody] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState<PendingAction[]>([]),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    void r.repository
      .thread(threadId)
      .then(async (t) => {
        if (!t) throw new Error("Unavailable");
        const [messages, actions] = await Promise.all([
          r.repository.messages(threadId),
          r.outbox.list("threadId", threadId),
        ]);
        if (live) {
          setThread(t);
          setRows(messages);
          setPending(actions);
          setError("");
        }
      })
      .catch(() => {
        if (live) {
          setThread(null);
          setRows([]);
          setPending([]);
          setError(
            "This conversation is unavailable or you do not have access.",
          );
        }
      });
    return () => {
      live = false;
    };
  }, [threadId, r.repository, r.outbox, r.revision]);
  async function send() {
    setBusy(true);
    try {
      await r.outbox.enqueue("message.send", { threadId, body: body.trim() });
      setPending(await r.outbox.list("threadId", threadId));
      setBody("");
      setError("");
      void r.sync();
    } catch {
      setError("Could not save this message. Your text has been retained.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell title={thread?.title ?? "Private conversation"}>
      <Text style={styles.text}>{error}</Text>
      <FlatList
        data={rows.filter((m) => !pending.some((p) => p.mutationId === m.id))}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <Text style={styles.text}>{item.body}</Text>}
      />
      {thread ? (
        <>
          {pending.map((p) => (
            <View key={p.mutationId} style={styles.card}>
              <Text style={styles.text}>{String(p.payload.body)}</Text>
              <Text style={styles.muted}>
                {p.status === "rejected"
                  ? "Message not accepted. Check your access before trying again."
                  : "Pending delivery — saved on this device"}
              </Text>
            </View>
          ))}
          <Button
            title="Retry pending messages"
            onPress={() => void r.sync()}
          />
          <TextInput
            accessibilityLabel="Private message"
            style={styles.input}
            multiline
            maxLength={5000}
            editable={!busy}
            value={body}
            onChangeText={setBody}
          />
          <Button
            title="Send"
            disabled={busy || !body.trim()}
            onPress={() => void send()}
          />
        </>
      ) : null}
    </AppShell>
  );
}
