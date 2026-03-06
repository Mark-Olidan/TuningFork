// app/(tabs)/index.tsx
import { COLOURS } from "@/constants/Colours";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Tuning Fork</Text>
        <Text style={styles.tagline}>Catch the vibe 🎶</Text>
      </View>

      {/* Main Card - tappable */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push("/screens/ListeningState")}
      >
        {/* Triple ring circle */}
        <View style={styles.bigCircle}>
          <View style={styles.middleCircle}>
            <View style={styles.innerCircle}>
              <Ionicons
                name="musical-notes"
                size={64}
                color={COLOURS.brightYellow}
              />
            </View>
          </View>
        </View>

        <Text style={styles.cardTitle}>Tap to Identify</Text>
        <Text style={styles.cardSubtitle}>
          Listen to the music around you{"\n"} and find your next favourite
          {"\n"} song to learn
        </Text>
      </TouchableOpacity>

      {/* Hum or Sing - separate row card */}
      <TouchableOpacity
        style={styles.humRow}
        activeOpacity={0.8}
        onPress={() => {}}
      >
        <View style={styles.humIconBox}>
          <Ionicons name="mic" size={22} color={COLOURS.darkBackground} />
        </View>
        <View style={styles.humText}>
          <Text style={styles.humTitle}>Hum or Sing</Text>
          <Text style={styles.humSubtitle}>Cant remember the lyrics?</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLOURS.darkBackground}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.darkBackground,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  // Header
  header: {
    marginTop: 20,
    marginBottom: 28,
    alignItems: "center",
  },
  appName: {
    fontSize: 48,
    fontFamily: "WinkyMilky",
    color: COLOURS.brightYellow,
    letterSpacing: 1,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: COLOURS.lightPurple,
    marginTop: 7,
    textAlign: "center",
  },

  // Main card
  card: {
    flex: 1,
    backgroundColor: COLOURS.primaryPurple,
    borderRadius: 36,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16, // 👈 gap between card and hum row
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },

  // Triple ring circle
  bigCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(249, 239, 189, 0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  middleCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(249, 239, 189, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(249, 239, 189, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: COLOURS.brightYellow,
    marginBottom: 10,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: COLOURS.lightPurple,
    textAlign: "center",
    lineHeight: 24,
  },

  // Hum or Sing row
  humRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOURS.brightYellow, // 👈 yellow
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    marginBottom: 4,
    gap: 14,
  },
  humIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(39, 40, 50, 0.15)", // subtle dark tint on yellow
    alignItems: "center",
    justifyContent: "center",
  },
  humText: {
    flex: 1,
  },
  humTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: COLOURS.darkBackground,
  },
  humSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLOURS.darkBackground,
    opacity: 0.6,
    marginTop: 2,
  },
});
