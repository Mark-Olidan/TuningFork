// app/screens/SongResult.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { isSongSaved, saveSong } from "@/lib/songHistory";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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

  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
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

const DEFAULT_ARTWORK =
  "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_After_Hours.png";

const pickParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export default function SongResult() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && height < 430;
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    title?: string | string[];
    artist?: string | string[];
    album?: string | string[];
    artwork?: string | string[];
  }>();

  const song = {
    title: pickParam(params.title) || "Unknown song",
    artist: pickParam(params.artist) || "Unknown artist",
    album: pickParam(params.album) || "Album unavailable",
    albumArt: pickParam(params.artwork) || DEFAULT_ARTWORK,
  };

  const [albumArtUri, setAlbumArtUri] = useState(song.albumArt);
  const [saved, setSaved] = useState(false);

  const cardSlide = useRef(new Animated.Value(80)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 800,
  }));

  useEffect(() => {
    setAlbumArtUri(song.albumArt || DEFAULT_ARTWORK);
  }, [song.albumArt]);

  useEffect(() => {
    const checkIfSaved = async () => {
      const alreadySaved = await isSongSaved({
        title: song.title,
        artist: song.artist,
        album: song.album,
      });
      setSaved(alreadySaved);
    };
    void checkIfSaved();
  }, [song.album, song.artist, song.title]);

  const handleSave = async () => {
    await saveSong({
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: albumArtUri,
    });
    setSaved(true);
    Alert.alert("Saved", "Song added to your Saved tab.");
  };

  const handleShare = async () => {
    try {
      const shareText = `Check out this song I found on Tuning Fork:\n${song.title} - ${song.artist}${song.album ? `\nAlbum: ${song.album}` : ""}`;
      await Share.share({
        message: shareText,
        url: albumArtUri,
        title: `${song.title} - ${song.artist}`,
      });
    } catch {
      Alert.alert("Share unavailable", "Could not open the share menu.");
    }
  };

  const navParams = { title: song.title, artist: song.artist };

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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isLandscape && styles.containerLandscape,
      ]}
    >
      {/* Confetti */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {confettiPieces.map((p) => (
          <ConfettiPiece key={p.id} delay={p.delay} x={p.x} />
        ))}
      </View>

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.subtitle} />
      </TouchableOpacity>

      {/* Found it header */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <Text style={[styles.foundText, { color: colors.title }, isLandscape && styles.foundTextLandscape]}>
          Found it! 🎉
        </Text>
        <Text style={[styles.foundSubtext, { color: colors.subtitle }]}>Here is your song</Text>
      </View>

      <View style={[styles.contentWrap, isLandscape && styles.contentWrapLandscape]}>
        {/* Song Card */}
        <Animated.View
          style={[
            styles.songCard,
            isLandscape && styles.songCardLandscape,
            { transform: [{ translateY: cardSlide }], opacity: cardOpacity },
          ]}
        >
          <Image
            source={{ uri: albumArtUri }}
            style={styles.albumArt}
            resizeMode="cover"
            onError={() => setAlbumArtUri(DEFAULT_ARTWORK)}
          />
          <View style={styles.songInfo}>
            <Text style={[styles.songTitle, isLandscape && styles.songTitleLandscape]}>{song.title}</Text>
            <Text style={styles.songArtist}>{song.artist}</Text>
            <Text style={styles.songAlbum}>{song.album}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actions, isLandscape && styles.actionsLandscape, { opacity: cardOpacity }]}>

          {/* Save + Share */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, isCompactLandscape && styles.secondaryButtonCompact]}
              activeOpacity={0.8}
              onPress={() => void handleSave()}
            >
              <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={colors.title} />
              <Text style={[styles.secondaryText, { color: colors.title }]}>{saved ? "Saved" : "Save"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, isCompactLandscape && styles.secondaryButtonCompact]}
              activeOpacity={0.8}
              onPress={() => void handleShare()}
            >
              <Ionicons name="share-outline" size={20} color={colors.title} />
              <Text style={[styles.secondaryText, { color: colors.title }]}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Sheet Music + Chords row */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.musicButton, isCompactLandscape && styles.musicButtonCompact]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/screens/SheetMusicScreen" as any, params: navParams })}
            >
              <Ionicons name="musical-note-outline" size={20} color={COLOURS.darkBackground} />
              <Text style={styles.musicButtonText}>Sheet Music</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.musicButton, isCompactLandscape && styles.musicButtonCompact]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/screens/ChordScreen" as any, params: navParams })}
            >
              <Ionicons name="options-outline" size={20} color={COLOURS.darkBackground} />
              <Text style={styles.musicButtonText}>Chords</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>

      {/* Identify Another Song */}
      <TouchableOpacity
        style={styles.tryAgain}
        onPress={() => router.push("/screens/ListeningState")}
      >
        <Text style={[styles.tryAgainText, { color: colors.subtitle }]}>Identify Another Song</Text>
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
    paddingBottom: 16,
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
  headerLandscape: {
    marginTop: 2,
    marginBottom: 10,
  },
  foundText: {
    fontFamily: "WinkyMilky",
    fontSize: 42,
    color: COLOURS.brightYellow,
    textAlign: "center",
  },
  foundTextLandscape: {
    fontSize: 32,
  },
  foundSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: COLOURS.lightPurple,
    marginTop: 4,
  },
  contentWrap: {
    flex: 1,
  },
  contentWrapLandscape: {
    flexDirection: "row",
    gap: 12,
  },
  songCard: {
    flex: 1,
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
  songCardLandscape: {
    flex: 1.2,
    marginBottom: 0,
  },
  albumArt: {
    width: "100%",
    flex: 1,
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
  songTitleLandscape: {
    fontSize: 22,
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
  actionsLandscape: {
    flex: 0.9,
    marginTop: 0,
    justifyContent: "center",
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
    minHeight: 44,
  },
  secondaryButtonCompact: {
    paddingVertical: 10,
  },
  secondaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: COLOURS.brightYellow,
  },
  musicButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    backgroundColor: COLOURS.lightPurple,
    minHeight: 44,
  },
  musicButtonCompact: {
    paddingVertical: 12,
  },
  musicButtonText: {
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