import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && height < 430;
  const { colors } = useAppTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isLandscape && styles.containerLandscape,
      ]}
    >
      {/* Header */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <Text
          style={[
            styles.appName,
            { color: colors.title },
            isLandscape && styles.appNameLandscape,
          ]}
        >
          Identify
        </Text>
        <Text
          style={[
            styles.tagline,
            { color: colors.subtitle },
            isLandscape && styles.taglineLandscape,
          ]}
        >
          Catch the vibe 🎶
        </Text>
      </View>

      <View style={[styles.mainArea, isLandscape && styles.mainAreaLandscape]}>
        {/* Main Card - tappable */}
        <TouchableOpacity
          style={[
            styles.card,
            isLandscape && styles.cardLandscape,
            isCompactLandscape && styles.cardCompactLandscape,
          ]}
          activeOpacity={0.85}
          onPress={() => router.push("/screens/ListeningState")}
        >
          {/* Triple ring circle */}
          <View
            style={[styles.bigCircle, isLandscape && styles.bigCircleLandscape]}
          >
            <View
              style={[
                styles.middleCircle,
                isLandscape && styles.middleCircleLandscape,
              ]}
            >
              <View
                style={[
                  styles.innerCircle,
                  isLandscape && styles.innerCircleLandscape,
                ]}
              >
                <Ionicons
                  name="musical-notes"
                  size={isLandscape ? 44 : 64}
                  color={COLOURS.brightYellow}
                />
              </View>
            </View>
          </View>

          <Text
            style={[
              styles.cardTitle,
              isLandscape && styles.cardTitleLandscape,
              isCompactLandscape && styles.cardTitleCompactLandscape,
            ]}
          >
            Tap to Identify
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              isLandscape && styles.cardSubtitleLandscape,
              isCompactLandscape && styles.cardSubtitleCompactLandscape,
            ]}
          >
            Listen to the music around you{"\n"} and find your next favourite
            {"\n"} song to learn
          </Text>
        </TouchableOpacity>

        {/* Hum or Sing - separate row card */}
        <TouchableOpacity
          style={[
            styles.humRow,
            isLandscape && styles.humRowLandscape,
            isCompactLandscape && styles.humRowCompactLandscape,
          ]}
          activeOpacity={0.8}
          onPress={() => router.push("/screens/ListeningState")}
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
      </View>
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
  containerLandscape: {
    paddingBottom: 70,
    paddingHorizontal: 18,
  },

  mainArea: {
    flex: 1,
  },
  mainAreaLandscape: {
    flexDirection: "row",
    gap: 14,
    alignItems: "stretch",
  },

  // Header
  header: {
    marginTop: 20,
    marginBottom: 28,
    alignItems: "flex-start",
  },
  headerLandscape: {
    marginTop: 8,
    marginBottom: 12,
  },
  appName: {
    fontSize: 48,
    fontFamily: "WinkyMilky",
    color: COLOURS.brightYellow,
    letterSpacing: 1,
    textAlign: "left",
  },
  appNameLandscape: {
    fontSize: 34,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: COLOURS.lightPurple,
    marginTop: 7,
    textAlign: "left",
  },
  taglineLandscape: {
    marginTop: 4,
    fontSize: 14,
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
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  cardLandscape: {
    flex: 1.2,
    marginBottom: 0,
    paddingVertical: 20,
    borderRadius: 24,
  },
  cardCompactLandscape: {
    paddingVertical: 14,
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
  bigCircleLandscape: {
    width: 148,
    height: 148,
    borderRadius: 74,
    marginBottom: 16,
  },
  middleCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(249, 239, 189, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  middleCircleLandscape: {
    width: 118,
    height: 118,
    borderRadius: 59,
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(249, 239, 189, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircleLandscape: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  cardTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: COLOURS.brightYellow,
    marginBottom: 10,
    textAlign: "center",
  },
  cardTitleLandscape: {
    fontSize: 25,
    marginBottom: 6,
  },
  cardTitleCompactLandscape: {
    fontSize: 20,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: COLOURS.lightPurple,
    textAlign: "center",
    lineHeight: 24,
  },
  cardSubtitleLandscape: {
    fontSize: 13,
    lineHeight: 19,
  },
  cardSubtitleCompactLandscape: {
    fontSize: 12,
    lineHeight: 17,
  },

  // Hum or Sing row
  humRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOURS.brightYellow,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    marginBottom: 4,
    gap: 14,
  },
  humRowLandscape: {
    flex: 0.9,
    marginTop: 0,
    marginBottom: 0,
  },
  humRowCompactLandscape: {
    paddingVertical: 12,
    minHeight: 44,
  },
  humIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(39, 40, 50, 0.15)",
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
