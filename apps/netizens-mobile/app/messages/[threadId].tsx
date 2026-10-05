import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function ThreadRoute() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  return <View><Text>Thread: {threadId}</Text></View>;
}
