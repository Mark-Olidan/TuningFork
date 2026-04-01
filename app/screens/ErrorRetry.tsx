// app/screens/ErrorRetry.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ErrorRetry() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && height < 430;
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    reason?: string | string[];
    type?: string | string[];
  }>();
  const reason = Array.isArray(params.reason)
    ? params.reason[0]
    : params.reason;
  const type = Array.isArray(params.type) ? params.type[0] : params.type;
  const isNoMatch = type === "no_match";

  // Sad face shake animation
  const shake = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  // Pulsing rings (same as listening state but slower/dimmer)
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shake the sad face on mount
    Animated.sequence([
      Animated.delay(300),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shake, {
            toValue: 10,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: -10,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 8,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: -8,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(shake, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.delay(3000), // pause between shakes
        ]),
        { iterations: 3 },
      ),
    ]).start();

    // Fade + slide up content
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Slow pulsing rings
    const pulseRing = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const r1 = pulseRing(ring1, 0);
    const r2 = pulseRing(ring2, 1200);
    r1.start();
    r2.start();

    return () => {
      r1.stop();
      r2.stop();
    };
  }, []);

  const accentColor = isNoMatch ? COLOURS.brightYellow : "#FF6B6B";

  const ringStyle = (anim: Animated.Value, size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    position: "absolute" as const,
    borderWidth: 1.5,
    borderColor: accentColor,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),

    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }),
      },
    ],
  });

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isLandscape && styles.containerLandscape,
      ]}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.subtitle} />
      </TouchableOpacity>

      {/* Center content */}
      <View
        style={[
          styles.centerContent,
          isLandscape && styles.centerContentLandscape,
        ]}
      >
        {/* Rings + Sad face */}
        <View
          style={[
            styles.ringContainer,
            isLandscape && styles.ringContainerLandscape,
          ]}
        >
          <Animated.View style={ringStyle(ring1, isLandscape ? 220 : 300)} />
          <Animated.View style={ringStyle(ring2, isLandscape ? 220 : 300)} />

          {/* Sad / neutral smiley */}
          <Animated.View
            style={[
              styles.sadFace,
              isLandscape && styles.sadFaceLandscape,
              { backgroundColor: accentColor, shadowColor: accentColor },
              {
                transform: [
                  { translateX: isNoMatch ? new Animated.Value(0) : shake },
                ],
              },
            ]}
          >
            {/* Eyes */}
            <View style={styles.eyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            {/* Mouth — neutral line for no_match, sad arc for error */}
            {isNoMatch ? (
              <View style={styles.neutralMouth} />
            ) : (
              <View style={styles.sadMouth} />
            )}
          </Animated.View>
        </View>

        {/* Error text */}
        <Animated.View
          style={[
            styles.textContent,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Text
            style={[
              styles.errorTitle,
              { color: accentColor },
              isLandscape && styles.errorTitleLandscape,
            ]}
          >
            {isNoMatch ? "No match found" : "Could not catch that"}
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.subtitle }]}>
            {isNoMatch
              ? reason ||
                "The audio came through, but we couldn't match it to any song"
              : reason ||
                "Make sure your device can hear the music clearly and try again"}
          </Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttons,
          isLandscape && styles.buttonsLandscape,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        {/* Try Again */}
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.85}
          onPress={() => router.push("/screens/ListeningState")}
        >
          <Ionicons name="refresh" size={20} color={COLOURS.darkBackground} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>

        {/* Hum instead */}
        <TouchableOpacity
          style={[
            styles.humButton,
            isCompactLandscape && styles.humButtonCompact,
          ]}
          activeOpacity={0.85}
          onPress={() => router.push("/screens/ListeningState")}
        >
          <Ionicons name="mic-outline" size={20} color={COLOURS.brightYellow} />
          <Text style={[styles.humText, { color: colors.title }]}>
            Hum or Sing Instead
          </Text>
        </TouchableOpacity>

        {/* Go Home */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/")}
        >
          <Text style={[styles.homeText, { color: colors.subtitle }]}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.darkBackground,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  containerLandscape: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginTop: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  // Center
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  centerContentLandscape: {
    gap: 18,
  },

  // Rings
  ringContainer: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  ringContainerLandscape: {
    width: 220,
    height: 220,
  },

  // Sad face — red tint instead of yellow
  sadFace: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  sadFaceLandscape: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  eyes: {
    flexDirection: "row",
    gap: 28,
    marginBottom: 4,
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLOURS.darkBackground,
  },

  // Sad mouth — flipped smile
  sadMouth: {
    width: 60,
    height: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 3,
    borderColor: COLOURS.darkBackground,
    borderBottomWidth: 0,
    marginTop: 8,
  },
  // Neutral mouth — flat line
  neutralMouth: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLOURS.darkBackground,
    marginTop: 8,
  },

  // Text
  textContent: {
    alignItems: "center",
    gap: 10,
  },
  errorTitle: {
    fontFamily: "WinkyMilky",
    fontSize: 36,
    color: "#FF6B6B",
    textAlign: "center",
  },
  errorTitleLandscape: {
    fontSize: 28,
  },
  errorSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: COLOURS.lightPurple,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },

  // Buttons
  buttons: {
    gap: 12,
  },
  buttonsLandscape: {
    gap: 8,
  },
  retryButton: {
    backgroundColor: COLOURS.brightYellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    minHeight: 44,
  },
  retryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: COLOURS.darkBackground,
  },
  humButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLOURS.lightPurple,
    minHeight: 44,
  },
  humButtonCompact: {
    paddingVertical: 12,
  },
  humText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: COLOURS.brightYellow,
  },
  homeButton: {
    alignSelf: "center",
    marginTop: 4,
  },
  homeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: COLOURS.lightPurple,
    textDecorationLine: "underline",
  },
});
