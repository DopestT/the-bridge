import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  text: { color: "#f3efe5", fontSize: 16, marginVertical: 8 },
  muted: { color: "#b9b3a7", fontSize: 14, marginVertical: 5 },
  input: {
    color: "#f3efe5",
    backgroundColor: "#202326",
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    marginVertical: 8,
  },
  card: {
    backgroundColor: "#202326",
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    minHeight: 48,
  },
  title: { color: "#f3efe5", fontSize: 20, fontWeight: "600" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: { padding: 12, minHeight: 48 },
});
