// app/(tabs)/saved.tsx — Combined Saved + History
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import {
  SavedSongItem,
  SongHistoryItem,
  deleteSavedSong,
  getSavedSongs,
  getSongHistory,
} from "@/lib/songHistory";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "saved" | "history";

const FALLBACK_ARTWORK =
  "https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_After_Hours.png";

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString();
};

export default function SavedScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("saved");
  const [savedSongs, setSavedSongs] = useState<SavedSongItem[]>([]);
  const [historySongs, setHistorySongs] = useState<SongHistoryItem[]>([]);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && height < 430;
  const { colors } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        const [saved, history] = await Promise.all([
          getSavedSongs(),
          getSongHistory(),
        ]);
        if (!active) return;
        setSavedSongs(saved);
        setHistorySongs(history);
      };
      void load();
      return () => {
        active = false;
      };
    }, []),
  );

  const handleDeleteSaved = (item: SavedSongItem) => {
    Alert.alert("Remove Song", `Remove "${item.title}" from saved?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await deleteSavedSong(item.id);
            setSavedSongs((prev) => prev.filter((s) => s.id !== item.id));
          })();
        },
      },
    ]);
  };

  const renderSavedItem = ({ item }: { item: SavedSongItem }) => (
    <View style={[styles.cardWrap, isLandscape && styles.cardWrapLandscape]}>
      <TouchableOpacity
        style={[
          styles.card,
          isLandscape && styles.cardLandscape,
          isCompactLandscape && styles.cardCompactLandscape,
        ]}
        activeOpacity={0.85}
        onLongPress={() => handleDeleteSaved(item)}
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
          <Text style={styles.songMeta} numberOfLines={1}>
            Saved {formatTime(item.savedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: SongHistoryItem }) => (
    <View style={[styles.cardWrap, isLandscape && styles.cardWrapLandscape]}>
      <TouchableOpacity
        style={[
          styles.card,
          isLandscape && styles.cardLandscape,
          isCompactLandscape && styles.cardCompactLandscape,
        ]}
        activeOpacity={0.85}
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
          <Text style={styles.songMeta} numberOfLines={1}>
            Detected {formatTime(item.detectedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isLandscape && styles.containerLandscape,
      ]}
    >
      {/* Title */}
      <Text
        style={[
          styles.title,
          { color: colors.title },
          isLandscape && styles.titleLandscape,
        ]}
      >
        {activeTab === "saved" ? "Saved Songs" : "History"}
      </Text>

      {/* Toggle */}
      <View style={[styles.toggleRow, { backgroundColor: colors.tabBar }]}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            activeTab === "saved" && styles.toggleBtnActive,
          ]}
          onPress={() => setActiveTab("saved")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleLabel,
              activeTab === "saved"
                ? styles.toggleLabelActive
                : { color: colors.subtitle },
            ]}
          >
            Saved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            activeTab === "history" && styles.toggleBtnActive,
          ]}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleLabel,
              activeTab === "history"
                ? styles.toggleLabelActive
                : { color: colors.subtitle },
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "saved" ? (
        savedSongs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.subtitle }]}>
              No saved songs yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedSongs}
            numColumns={isLandscape ? 2 : 1}
            key={isLandscape ? "s-land" : "s-port"}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={renderSavedItem}
          />
        )
      ) : historySongs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.subtitle }]}>
            No history yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historySongs}
          numColumns={isLandscape ? 2 : 1}
          key={isLandscape ? "h-land" : "h-port"}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderHistoryItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  containerLandscape: {
    paddingHorizontal: 14,
  },
  title: {
    fontFamily: "WinkyMilky",
    fontSize: 38,
    color: COLOURS.brightYellow,
    marginTop: 8,
    marginBottom: 14,
  },
  titleLandscape: {
    fontSize: 30,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: COLOURS.brightYellow,
  },
  toggleLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  toggleLabelActive: {
    color: COLOURS.darkBackground,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
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
  songMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 3,
  },
});
