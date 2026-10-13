import { useLocalSearchParams } from "expo-router";
import { ThreadScreen } from "../../src/features/messages/ThreadScreen";
export default function Route() {
  const params = useLocalSearchParams<{ threadId: string }>();
  return <ThreadScreen threadId={params.threadId ?? ""} />;
}
