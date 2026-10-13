import { Button, Text } from "react-native";
import { useRuntime } from "../src/runtime/RuntimeProvider";
import { AppShell } from "../src/components/AppShell";
import { styles } from "../src/components/mobile-styles";
export default function Profile() {
  const r = useRuntime();
  return (
    <AppShell title="Profile">
      <Text style={styles.text}>Citizen account</Text>
      <Button title="Sign out" onPress={() => void r.logout()} />
    </AppShell>
  );
}
