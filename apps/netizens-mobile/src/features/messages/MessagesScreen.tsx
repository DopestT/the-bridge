import { useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import type { Thread } from "../../api/netizens-repository";
export function MessagesScreen() {
  const r = useRuntime(),
    router = useRouter();
  const [rows, setRows] = useState<Thread[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    void r.repository
      .threads()
      .then((data) => {
        if (live) setRows(data);
      })
      .catch(() => {
        if (live) {
          setRows([]);
          setError("Reconnect to open private conversations.");
        }
      });
    return () => {
      live = false;
    };
  }, [r.repository, r.revision]);
  return (
    <AppShell title="Messages">
      <Text style={styles.text}>{error}</Text>
      <FlatList
        data={rows}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={
          <Text style={styles.text}>No conversations available.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={styles.card}
            onPress={() => router.push(`/messages/${item.id}`)}
          >
            <Text style={styles.text}>
              {item.title ?? "Private conversation"}
            </Text>
          </Pressable>
        )}
      />
    </AppShell>
  );
}
