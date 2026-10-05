import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function EntityRoute() {
  const { entityId } = useLocalSearchParams<{ entityId: string }>();
  return <View><Text>Entity: {entityId}</Text></View>;
}
