import { useEffect, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import type { Message, Thread } from "../../api/netizens-repository";
import type { PendingAction } from "../../sync/types";

const reportCategories = [
  { label: "Harassment", value: "harassment" },
  { label: "Spam", value: "spam" },
  { label: "Threats", value: "threats" },
  { label: "Other", value: "other" },
] as const;

export function ThreadScreen({ threadId }: { threadId: string }) {
  return <ThreadContent key={threadId} threadId={threadId} />;
}

function ThreadContent({ threadId }: { threadId: string }) {
  const r = useRuntime();
  const [thread, setThread] = useState<Thread | null>(null),
    [rows, setRows] = useState<Message[]>([]),
    [body, setBody] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [pending, setPending] = useState<PendingAction[]>([]),
    [blockedSenders, setBlockedSenders] = useState<string[]>([]),
    [reportingMessageId, setReportingMessageId] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [safetyBusy, setSafetyBusy] = useState(false);

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

  async function blockSender(senderId: string) {
    setSafetyBusy(true);
    setError("");
    setNotice("");
    try {
      await r.repository.blockCitizen(senderId);
      setBlockedSenders((current) =>
        current.includes(senderId) ? current : [...current, senderId],
      );
      setReportingMessageId(null);
      setNotice("Citizen blocked. Their messages are hidden here.");
    } catch {
      setError("Could not block this Citizen. Try again when connected.");
    } finally {
      setSafetyBusy(false);
    }
  }

  async function reportMessage(messageId: string, category: string) {
    setSafetyBusy(true);
    setError("");
    setNotice("");
    try {
      await r.repository.reportMessage(messageId, category, "");
      setReportingMessageId(null);
      setNotice("Report submitted.");
    } catch {
      setError("Could not submit this report. Try again when connected.");
    } finally {
      setSafetyBusy(false);
    }
  }

  const visibleRows = rows.filter(
    (message) =>
      !blockedSenders.includes(message.sender_id) &&
      !pending.some((action) => action.mutationId === message.id),
  );

  return (
    <AppShell title={thread?.title ?? "Private conversation"}>
      {error ? <Text style={styles.text}>{error}</Text> : null}
      {notice ? <Text style={styles.text}>{notice}</Text> : null}
      <FlatList
        data={visibleRows}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>{item.body}</Text>
            {item.sender_id !== r.userId ? (
              <View>
                <Button
                  title="Block sender"
                  disabled={safetyBusy}
                  onPress={() => void blockSender(item.sender_id)}
                />
                <Button
                  title="Report message"
                  disabled={safetyBusy}
                  onPress={() =>
                    setReportingMessageId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                />
                {reportingMessageId === item.id ? (
                  <View>
                    {reportCategories.map((category) => (
                      <Button
                        key={category.value}
                        title={category.label}
                        disabled={safetyBusy}
                        onPress={() =>
                          void reportMessage(item.id, category.value)
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
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