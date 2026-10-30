import { Button, ScrollView } from "react-native";
import { useRuntime } from "../src/runtime/RuntimeProvider";
import { AppShell } from "../src/components/AppShell";
import { CitizenProfileForm } from "../src/features/profile/CitizenProfileForm";
import { AccountDeletion } from "../src/features/profile/AccountDeletion";
export default function Profile() {
  const r = useRuntime();
  return (
    <AppShell title="Profile">
      <ScrollView keyboardShouldPersistTaps="handled">
      <CitizenProfileForm citizen={r.citizen} onSave={r.saveProfile} scrollable={false} />
      <AccountDeletion onDelete={r.deleteAccount} />
      <Button title="Sign out" onPress={() => void r.logout()} />
      </ScrollView>
    </AppShell>
  );
}
