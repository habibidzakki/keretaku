import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingTop: Platform.OS === "web" ? 80 : 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#0f172a",
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  trainName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },

  trainClass: {
    fontSize: 14,
    fontWeight: "600",
  },

  time: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 16,
  },

  button: {
    backgroundColor: "#e125eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
