import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppShell } from "../src/components/AppShell";
import { colors, spacing } from "../src/theme/tokens";

/**
 * Development preview only. There is intentionally no camera request,
 * stream token, live chat, audience claim, or provider connection here.
 * This route is not linked from NETIZENS production navigation.
 */
export default function LivePreview() {
  return (
    <AppShell title="NETIZENS LIVE" breadcrumb={["World", "Live preview"]}>
      <ScrollView contentContainerStyle={ui.page}>
        <Text style={ui.flag}>DESIGN PREVIEW — NOT BROADCASTING</Text>
        <View style={ui.stage}>
          <Text style={ui.stageHeading}>Host video</Text>
          <Text style={ui.muted}>Camera and microphone are not connected.</Text>
        </View>
        <View style={ui.row}>
          <View style={ui.viewer}>
            <Text style={ui.heading}>Viewer position A</Text>
            <Text style={ui.muted}>Awaiting authenticated test session</Text>
          </View>
          <View style={ui.viewer}>
            <Text style={ui.heading}>Viewer position B</Text>
            <Text style={ui.muted}>Awaiting authenticated test session</Text>
          </View>
        </View>
        <View style={ui.section}>
          <Text style={ui.heading}>Chat and moderation</Text>
          <Text style={ui.muted}>
            Disabled until signed-in server authorization, role-scoped stream
            tickets, abuse limits, and moderation endpoints are verified.
          </Text>
        </View>
        <Text style={ui.note}>
          No real viewers, stream, recording, audience metrics or live events
          are represented on this page.
        </Text>
      </ScrollView>
    </AppShell>
  );
}

const ui = StyleSheet.create({
  page: { gap: spacing.md, paddingBottom: spacing.lg },
  flag: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  stage: {
    minHeight: 190, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, justifyContent: "center", alignItems: "center",
    padding: spacing.md, backgroundColor: colors.background,
  },
  stageHeading: { color: colors.text, fontWeight: "700", fontSize: 19 },
  heading: { color: colors.text, fontWeight: "700", fontSize: 14 },
  muted: { color: colors.muted, fontSize: 13, marginTop: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  viewer: {
    flex: 1, minHeight: 100, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, borderRadius: 8,
  },
  section: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  note: { color: colors.muted, fontSize: 12 },
});
