import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { styles } from "../../components/mobile-styles";
export function LocalScreen() {
  const [area, setArea] = useState(""),
    [notice, setNotice] = useState("");
  async function locate() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setNotice("You can enter your area instead.");
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const results = await Location.reverseGeocodeAsync(current.coords);
      setArea(results[0]?.city ?? results[0]?.region ?? "");
      setNotice("Only the area name is displayed.");
    } catch {
      setNotice("Location unavailable. Enter your area instead.");
    }
  }
  return (
    <View>
      <Text style={styles.text}>
        Explore nearby. Location access is optional.
      </Text>
      <TextInput
        accessibilityLabel="Your area"
        style={styles.input}
        value={area}
        onChangeText={setArea}
        placeholder="City or neighborhood"
        placeholderTextColor="#aaa"
      />
      <Button title="Use my area" onPress={() => void locate()} />
      <Text style={styles.muted}>{notice}</Text>
    </View>
  );
}
