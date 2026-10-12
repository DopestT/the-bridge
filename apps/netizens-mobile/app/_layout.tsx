import { View } from "react-native";
import { PrimaryNavigation } from "../src/components/PrimaryNavigation";
import { Stack } from "expo-router";
import { RuntimeProvider } from "../src/runtime/RuntimeProvider";
export default function RootLayout() {
  return (
    <RuntimeProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        <PrimaryNavigation />
      </View>
    </RuntimeProvider>
  );
}
