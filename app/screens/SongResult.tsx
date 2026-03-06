// app/screens/SongResult.tsx
import { COLOURS } from "@/constants/Colours";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  COLOURS.brightYellow,
  COLOURS.lightPurple,
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#A855F7",
];

function ConfettiPiece({ delay, x }: { delay: number; x: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT * 0.6,
          duration: 2500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 200,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(1500),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const color =
    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = Math.random() * 8 + 6;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY },
          { translateX },
          {
            rotate: rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", `${Math.random() * 720}deg`],
            }),
          },
        ],
      }}
    />
  );
}

const MOCK_SONG = {
  title: "Blinding Lights",
  artist: "The Weeknd",
  album: "After Hours",
  albumArt:
    "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_After_Hours.png",
};

export default function SongResult() {
  const router = useRouter();

  const cardSlide = useRef(new Animated.Value(80)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 800,
  }));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {confettiPieces.map((p) => (
          <ConfettiPiece key={p.id} delay={p.delay} x={p.x} />
        ))}
      </View>

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLOURS.lightPurple} />
      </TouchableOpacity>

      {/* Found it header */}
      <View style={styles.header}>
        <Text style={styles.foundText}>Found it! 🎉</Text>
        <Text style={styles.foundSubtext}>Here is your song</Text>
      </View>

      {/* Song Card */}
      <Animated.View
        style={[
          styles.songCard,
          { transform: [{ translateY: cardSlide }], opacity: cardOpacity },
        ]}
      >
        <Image
          source={{ uri: MOCK_SONG.albumArt }}
          style={styles.albumArt}
          resizeMode="cover"
        />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{MOCK_SONG.title}</Text>
          <Text style={styles.songArtist}>{MOCK_SONG.artist}</Text>
          <Text style={styles.songAlbum}>{MOCK_SONG.album}</Text>
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[styles.actions, { opacity: cardOpacity }]}>
        {/* Save + Share */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
            <Ionicons
              name="bookmark-outline"
              size={20}
              color={COLOURS.brightYellow}
            />
            <Text style={styles.secondaryText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
            <Ionicons
              name="share-outline"
              size={20}
              color={COLOURS.brightYellow}
            />
            <Text style={styles.secondaryText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Sheet Music */}
        <TouchableOpacity style={styles.sheetMusicButton} activeOpacity={0.85}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color={COLOURS.darkBackground}
          />
          <Text style={styles.sheetMusicText}>View Sheet Music</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Identify Another Song */}
      <TouchableOpacity
        style={styles.tryAgain}
        onPress={() => router.push("/screens/ListeningState")}
      >
        <Text style={styles.tryAgainText}>Identify Another Song</Text>
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
  backButton: {
    marginTop: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  foundText: {
    fontFamily: "WinkyMilky",
    fontSize: 42,
    color: COLOURS.brightYellow,
    textAlign: "center",
  },
  foundSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: COLOURS.lightPurple,
    marginTop: 4,
  },

  // Song card — big and fills space
  songCard: {
    flex: 1, // 👈 fills remaining space
    backgroundColor: COLOURS.primaryPurple,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  albumArt: {
    width: "100%",
    flex: 1, // 👈 art takes up all available card space
  },
  songInfo: {
    padding: 24,
    gap: 8,
  },
  songTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: COLOURS.brightYellow,
  },
  songArtist: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  songAlbum: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: COLOURS.lightPurple,
    marginTop: 2,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    backgroundColor: COLOURS.primaryPurple,
  },
  secondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: COLOURS.brightYellow,
  },
  sheetMusicButton: {
    backgroundColor: COLOURS.lightPurple,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },
  sheetMusicText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: COLOURS.darkBackground,
  },
  tryAgain: {
    alignSelf: "center",
    marginTop: 16,
  },
  tryAgainText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: COLOURS.lightPurple,
    textDecorationLine: "underline",
  },
});
