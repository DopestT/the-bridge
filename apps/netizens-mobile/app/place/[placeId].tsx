import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function PlaceRoute() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  return <View><Text>Place: {placeId}</Text></View>;
}
