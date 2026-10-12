import { useEffect, useState } from "react";
import { FlatList, Pressable, Text } from "react-native";
import { useRouter, type Href } from "expo-router";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import type { Notice } from "../../api/netizens-repository";
import { routeNotification } from "./notification-router";
import { routeToHref } from "../../navigation/routes";
export function NotificationsScreen() {
  const r = useRuntime(),
    router = useRouter();
  const [rows, setRows] = useState<Notice[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    void r.repository
      .notifications()
      .then((data) => {
        if (live) setRows(data);
      })
      .catch(() => {
        if (live) {
          setRows([]);
          setError("Reconnect to refresh notifications.");
        }
      });
    return () => {
      live = false;
    };
  }, [r.repository, r.revision]);
  async function open(n: Notice) {
    try {
      await r.outbox.enqueue("notification.read", {
        id: String(n.id),
        readAt: new Date().toISOString(),
      });
      void r.sync();
      const route = routeNotification({ ...n });
      if (route) router.push(routeToHref(route) as Href);
    } catch {
      setError("Could not mark this notification read.");
    }
  }
  return (
    <AppShell title="Notifications">
      <Text style={styles.text}>{error}</Text>
      <FlatList
        data={rows}
        keyExtractor={(n) => String(n.id)}
        ListEmptyComponent={
          <Text style={styles.text}>No notifications yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            accessibilityRole="button"
            onPress={() => void open(item)}
          >
            <Text style={styles.text}>
              {item.read_at ? "" : "Unread · "}
              {item.notification_type}
            </Text>
          </Pressable>
        )}
      />
    </AppShell>
  );
}
