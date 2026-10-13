import { useLocalSearchParams } from "expo-router";
import { EntityScreen } from "../../src/features/world/EntityScreen";
export default function Route() {
  const params = useLocalSearchParams<{ entityId: string }>();
  return <EntityScreen entityId={params.entityId ?? ""} />;
}
