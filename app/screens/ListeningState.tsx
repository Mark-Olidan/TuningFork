// app/screens/ListeningState.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { useIdentifySong } from "@/hooks/use-identify-song";
import { saveSongToHistory } from "@/lib/songHistory";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function ListeningState() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && height < 430;
  const { colors } = useAppTheme();
  const { status, result, error, startListening, cancelListening } =
    useIdentifySong();
  const hasStartedRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  // Pulsing rings
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  // Smiley face gentle bounce
  const bounce = useRef(new Animated.Value(1)).current;

  // Dots animation for "CAPTURING THE BEAT..."
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing rings - staggered
    const pulseRing = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
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

    // Gentle smiley bounce
    const bounceAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // Dots blinking
    const dotsAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotsOpacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );

    const r1 = pulseRing(ring1, 0);
    const r2 = pulseRing(ring2, 600);
    const r3 = pulseRing(ring3, 1200);

    r1.start();
    r2.start();
    r3.start();
    bounceAnim.start();
    dotsAnim.start();

    return () => {
      r1.stop();
      r2.stop();
      r3.stop();
      bounceAnim.stop();
      dotsAnim.stop();
    };
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    void startListening();
  }, [startListening]);

  useEffect(() => {
    if (hasNavigatedRef.current) {
      return;
    }

    if (status === "matched" && result) {
      hasNavigatedRef.current = true;
      void (async () => {
        await saveSongToHistory({
          title: result.title,
          artist: result.artist,
          album: result.album,
          artwork: result.artwork,
          acrid: result.acrid,
        });

        router.replace({
          pathname: "/screens/SongResult",
          params: {
            title: result.title,
            artist: result.artist,
            album: result.album || "",
            artwork: result.artwork || "",
          },
        });
      })();
      return;
    }

    if (status === "no_match" || status === "error") {
      hasNavigatedRef.current = true;
      router.replace({
        pathname: "/screens/ErrorRetry",
        params: {
          reason: error || "No match found.",
        },
      });
    }
  }, [error, result, router, status]);

  const ringStyle = (anim: Animated.Value, size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    position: "absolute" as const,
    borderWidth: 1.5,
    borderColor: COLOURS.lightPurple,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }),
      },
    ],
  });

  const statusLabel =
    status === "uploading" ? "ANALYZING YOUR RECORDING..." : "CAPTURING THE BEAT...";

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
      <View style={[styles.centerContent, isLandscape && styles.centerContentLandscape]}>
        {/* Rings + Smiley */}
        <View style={[styles.ringContainer, isLandscape && styles.ringContainerLandscape]}>
          <Animated.View style={ringStyle(ring1, isLandscape ? 220 : 320)} />
          <Animated.View style={ringStyle(ring2, isLandscape ? 220 : 320)} />
          <Animated.View style={ringStyle(ring3, isLandscape ? 220 : 320)} />

          {/* Smiley face */}
          <Animated.View
            style={[
              styles.smiley,
              isLandscape && styles.smileyLandscape,
              { transform: [{ scale: bounce }] },
            ]}
          >
            {/* Eyes */}
            <View style={styles.eyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            {/* Smile */}
            <View style={styles.smile} />
          </Animated.View>
        </View>

        {/* Capturing text */}
        <Animated.Text style={[styles.capturingText, { opacity: dotsOpacity, color: colors.title }]}>
          {statusLabel}
        </Animated.Text>
      </View>

      {/* Cancel button */}
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: colors.border }]}
        onPress={async () => {
          await cancelListening();
          router.back();
        }}
      >
        <Text style={[styles.cancelText, { color: colors.subtitle }]}>Cancel</Text>
      </TouchableOpacity>
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
    paddingBottom: 20,
  },

  // Back button
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
    gap: 48,
  },
  centerContentLandscape: {
    gap: 24,
  },

  // Rings
  ringContainer: {
    width: 320,
    height: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  ringContainerLandscape: {
    width: 220,
    height: 220,
  },

  // Smiley
  smiley: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLOURS.brightYellow,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: COLOURS.brightYellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  smileyLandscape: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
  smile: {
    width: 60,
    height: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderWidth: 3,
    borderColor: COLOURS.darkBackground,
    borderTopWidth: 0,
  },

  // Capturing text
  capturingText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: COLOURS.brightYellow,
    letterSpacing: 3,
    textAlign: "center",
  },

  // Cancel
  cancelButton: {
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLOURS.lightPurple,
    minHeight: 44,
  },
  cancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: COLOURS.lightPurple,
  },
});
