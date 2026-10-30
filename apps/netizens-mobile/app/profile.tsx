import { Button } from "react-native";
import { useRuntime } from "../src/runtime/RuntimeProvider";
import { AppShell } from "../src/components/AppShell";
import { CitizenProfileForm } from "../src/features/profile/CitizenProfileForm";
export default function Profile() {
  const r = useRuntime();
  return (
    <AppShell title="Profile">
      <CitizenProfileForm citizen={r.citizen} onSave={r.saveProfile} />
      <Button title="Sign out" onPress={() => void r.logout()} />
    </AppShell>
  );
}
