import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { SavedSongItem, deleteSavedSong, getSavedSongs } from "@/lib/songHistory";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FALLBACK_ARTWORK =
  "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_After_Hours.png";

const formatSavedTime = (savedAt: string) => {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return "Saved recently";
  }

  return `Saved ${date.toLocaleString()}`;
};

export default function Saved() {
  const [savedSongs, setSavedSongs] = useState<SavedSongItem[]>([]);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && height < 430;
  const { colors } = useAppTheme();

  const handleDeleteSong = (item: SavedSongItem) => {
    Alert.alert(
      "Remove Saved Song",
      `Remove \"${item.title}\" from your saved songs?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await deleteSavedSong(item.id);
              setSavedSongs((prev) => prev.filter((song) => song.id !== item.id));
            })();
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadSaved = async () => {
        const items = await getSavedSongs();
        if (active) {
          setSavedSongs(items);
        }
      };

      void loadSaved();

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
      <Text style={[styles.title, { color: colors.title }, isLandscape && styles.titleLandscape]}>Saved Songs</Text>
      <Text style={[styles.subtitle, { color: colors.subtitle }, isLandscape && styles.subtitleLandscape]}>
        Songs you bookmark from results will appear here.
      </Text>

      {savedSongs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved songs yet.</Text>
        </View>
      ) : (
        <FlatList
          data={savedSongs}
          numColumns={isLandscape ? 2 : 1}
          key={isLandscape ? "landscape" : "portrait"}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.cardWrap, isLandscape && styles.cardWrapLandscape]}>
              <TouchableOpacity
                style={[
                  styles.card,
                  isLandscape && styles.cardLandscape,
                  isCompactLandscape && styles.cardCompactLandscape,
                ]}
                activeOpacity={0.85}
                onLongPress={() => handleDeleteSong(item)}
              >
                <Image
                  source={{ uri: item.artwork || FALLBACK_ARTWORK }}
                  style={[styles.artwork, isLandscape && styles.artworkLandscape]}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                  <Text style={styles.songAlbum} numberOfLines={1}>
                    {item.album || "Album unavailable"}
                  </Text>
                  <Text style={styles.savedAt} numberOfLines={1}>
                    {formatSavedTime(item.savedAt)}
                  </Text>
                </View>
              </TouchableOpacity>
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: COLOURS.lightPurple,
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
    gap: 12,
    backgroundColor: COLOURS.primaryPurple,
    borderRadius: 18,
    padding: 12,
  },
  cardLandscape: {
    borderRadius: 14,
    padding: 10,
  },
  cardCompactLandscape: {
    minHeight: 44,
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
  cardContent: {
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
  savedAt: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 3,
  },
});
