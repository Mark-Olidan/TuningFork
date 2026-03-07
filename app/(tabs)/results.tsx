import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { SongHistoryItem, getSongHistory } from "@/lib/songHistory";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FALLBACK_ARTWORK =
  "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_After_Hours.png";

const formatDetectedTime = (detectedAt: string) => {
  const date = new Date(detectedAt);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString();
};

export default function Results() {
  const [history, setHistory] = useState<SongHistoryItem[]>([]);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { colors } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadHistory = async () => {
        const items = await getSongHistory();
        if (active) {
          setHistory(items);
        }
      };

      void loadHistory();

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isLandscape && styles.containerLandscape,
      ]}
    >
      <Text style={[styles.title, { color: colors.title }, isLandscape && styles.titleLandscape]}>Recent Detections</Text>
      <Text style={[styles.subtitle, { color: colors.subtitle }, isLandscape && styles.subtitleLandscape]}>Latest 10 songs you identified</Text>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No songs detected yet</Text>
          <Text style={styles.emptySubtitle}>
            Start identifying songs and they will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          numColumns={isLandscape ? 2 : 1}
          key={isLandscape ? "landscape" : "portrait"}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.cardWrap, isLandscape && styles.cardWrapLandscape]}>
              <View style={[styles.card, isLandscape && styles.cardLandscape]}>
              <Image
                source={{ uri: item.artwork || FALLBACK_ARTWORK }}
                style={[styles.artwork, isLandscape && styles.artworkLandscape]}
              />
              <View style={styles.content}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
                <Text style={styles.songAlbum} numberOfLines={1}>
                  {item.album || "Album unavailable"}
                </Text>
                <Text style={styles.detectedAt} numberOfLines={1}>
                  {formatDetectedTime(item.detectedAt)}
                </Text>
              </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOURS.darkBackground,
    paddingHorizontal: 20,
  },
  containerLandscape: {
    paddingHorizontal: 14,
  },
  title: {
    fontFamily: "WinkyMilky",
    fontSize: 38,
    color: COLOURS.brightYellow,
    marginTop: 8,
  },
  titleLandscape: {
    fontSize: 30,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLOURS.lightPurple,
    marginBottom: 18,
  },
  subtitleLandscape: {
    marginBottom: 12,
  },
  list: {
    paddingBottom: 24,
    gap: 10,
  },
  cardWrap: {
    width: "100%",
  },
  cardWrapLandscape: {
    width: "50%",
    paddingHorizontal: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOURS.primaryPurple,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  cardLandscape: {
    padding: 10,
    borderRadius: 14,
  },
  artwork: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  artworkLandscape: {
    width: 62,
    height: 62,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: COLOURS.brightYellow,
  },
  songArtist: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  songAlbum: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLOURS.lightPurple,
  },
  detectedAt: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 3,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: COLOURS.brightYellow,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLOURS.lightPurple,
    textAlign: "center",
    lineHeight: 22,
  },
});
