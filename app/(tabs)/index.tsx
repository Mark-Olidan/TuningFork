// app/(tabs)/index.tsx  ← Landing/home page
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOGO_DARK = require("@/assets/images/LogoDark.png");
const LOGO_LIGHT = require("@/assets/images/LogoLight.png");

export default function LandingScreen() {
  const router = useRouter();
  const { colors, isLight } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isShort = height < 720;

  // Animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(16)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -5,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 5,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );

    intro.start(() => {
      floatLoop.start();
    });

    return () => {
      intro.stop();
      floatLoop.stop();
    };
  }, [
    buttonOpacity,
    buttonY,
    logoFloat,
    logoOpacity,
    logoScale,
    taglineOpacity,
    taglineY,
  ]);

  const logoSize = isLandscape ? 220 : isShort ? 280 : 320;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.glowTop,
          {
            backgroundColor: isLight
              ? "rgba(156, 132, 255, 0.26)"
              : "rgba(168, 127, 255, 0.18)",
          },
        ]}
      />
      <View
        style={[
          styles.glowBottom,
          {
            backgroundColor: isLight
              ? "rgba(116, 92, 255, 0.18)"
              : "rgba(168, 127, 255, 0.16)",
          },
        ]}
      />

      <View
        style={[
          styles.inner,
          isLandscape && styles.innerLandscape,
          { gap: isShort ? 18 : 28 },
        ]}
      >
        {/* Logo — swaps based on theme */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { translateY: logoFloat }],
          }}
        >
          <Image
            source={isLight ? LOGO_DARK : LOGO_LIGHT}
            style={{ width: logoSize, height: logoSize * 0.75 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.textBlock,
            { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
          ]}
        >
          <Text style={[styles.tagline, { color: colors.subtitle }]}>
            Find your melody
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtitle }]}>
            Identify songs instantly and tune your instruments.
          </Text>
        </Animated.View>

        {/* Get Started button */}
        <Animated.View
          style={[
            styles.buttonWrapper,
            { opacity: buttonOpacity, transform: [{ translateY: buttonY }] },
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() => router.push("/identify")}
            accessibilityRole="button"
            accessibilityLabel="Get started"
            accessibilityHint="Opens the identify screen"
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  glowTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 160,
    top: -90,
    right: -60,
  },
  glowBottom: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 180,
    bottom: -110,
    left: -100,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 28,
  },
  innerLandscape: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 24,
  },
  textBlock: {
    alignItems: "center",
  },
  tagline: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.85,
    maxWidth: 290,
    lineHeight: 22,
  },
  buttonWrapper: {
    width: "100%",
    maxWidth: 320,
  },
  button: {
    backgroundColor: COLOURS.brightYellow,
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: COLOURS.darkBackground,
    letterSpacing: 0.5,
  },
});
