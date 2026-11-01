import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { PRIMARY_TABS } from "./AppShell";
import { colors } from "../theme/tokens";
export function PrimaryNavigation() {
  const router = useRouter();
  const path = usePathname();
  const section = path.split('/')[1];
  const active = ['world', 'place', 'entity', ''].includes(section) ? 'world' : section;
  return (
    <View style={navigation.bar} accessibilityRole="tablist" accessibilityLabel="Primary navigation">
      {PRIMARY_TABS.map((tab) => (
        <Pressable
          key={tab.key}
          style={[navigation.tab, active === tab.key && navigation.selected]}
          accessibilityRole="tab"
          accessibilityLabel={tab.accessibilityLabel}
          accessibilityState={{ selected: active === tab.key }}
          onPress={() => router.navigate(tab.href)}
        >
          <Text style={[navigation.label, active === tab.key && navigation.selectedLabel]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const navigation = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  tab: { flex: 1, minHeight: 56, paddingVertical: 10, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', borderTopWidth: 2, borderTopColor: 'transparent' },
  selected: { borderTopColor: colors.text },
  label: { color: colors.muted, fontSize: 12, textAlign: 'center', flexShrink: 1 },
  selectedLabel: { color: colors.text, fontWeight: '700' },
});
