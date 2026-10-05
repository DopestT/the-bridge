import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content} accessibilityRole="summary">
        <Text style={styles.eyebrow}>ONE NETWORK, MANY PLACES</Text>
        <Text style={styles.title}>NETIZENS</Text>
        <Text style={styles.prompt}>What do you want to do?</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0c0d' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  eyebrow: { color: '#b9b3a7', fontSize: 12, letterSpacing: 1.8, marginBottom: 12 },
  title: { color: '#f3efe5', fontSize: 42, fontWeight: '700', letterSpacing: 1 },
  prompt: { color: '#f3efe5', fontSize: 20, marginTop: 18 },
});
