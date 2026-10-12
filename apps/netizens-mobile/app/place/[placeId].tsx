import { useLocalSearchParams } from "expo-router";
import { PlaceScreen } from "../../src/features/world/PlaceScreen";
export default function Route() {
  const params = useLocalSearchParams<{ placeId: string }>();
  return <PlaceScreen placeId={params.placeId ?? ""} />;
}
