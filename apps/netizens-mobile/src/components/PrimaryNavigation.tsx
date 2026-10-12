import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PRIMARY_TABS } from "./AppShell";
import { styles } from "./mobile-styles";
export function PrimaryNavigation() {
  const router = useRouter();
  return (
    <View style={[styles.row, { backgroundColor: "#202326" }]}>
      {PRIMARY_TABS.map((tab) => (
        <Pressable
          key={tab.key}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={tab.accessibilityLabel}
          onPress={() => router.navigate(tab.href)}
        >
          <Text style={styles.text}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
