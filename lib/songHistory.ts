import AsyncStorage from "@react-native-async-storage/async-storage";

const SONG_HISTORY_KEY = "tuningfork_song_history";
const SAVED_SONGS_KEY = "tuningfork_saved_songs";
const MAX_HISTORY_ITEMS = 10;
const MAX_SAVED_ITEMS = 100;

export type SongHistoryItem = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  acrid?: string;
  detectedAt: string;
};

export type SavedSongItem = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  acrid?: string;
  savedAt: string;
};

type SaveSongHistoryInput = {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  acrid?: string;
};

type SaveSongInput = {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  acrid?: string;
};

export const getSongHistory = async (): Promise<SongHistoryItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(SONG_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as SongHistoryItem[];
  } catch {
    return [];
  }
};

export const saveSongToHistory = async (
  song: SaveSongHistoryInput,
): Promise<void> => {
  const previous = await getSongHistory();
  const normalizedTitle = song.title.trim().toLowerCase();
  const normalizedArtist = song.artist.trim().toLowerCase();

  const nextItem: SongHistoryItem = {
    id: `${Date.now()}-${song.acrid || normalizedTitle}`,
    title: song.title,
    artist: song.artist,
    album: song.album,
    artwork: song.artwork,
    acrid: song.acrid,
    detectedAt: new Date().toISOString(),
  };

  const withoutDuplicate = previous.filter((item) => {
    if (song.acrid && item.acrid) {
      return item.acrid !== song.acrid;
    }

    return !(
      item.title.trim().toLowerCase() === normalizedTitle &&
      item.artist.trim().toLowerCase() === normalizedArtist
    );
  });

  const updated = [nextItem, ...withoutDuplicate].slice(0, MAX_HISTORY_ITEMS);
  await AsyncStorage.setItem(SONG_HISTORY_KEY, JSON.stringify(updated));
};

export const getSavedSongs = async (): Promise<SavedSongItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(SAVED_SONGS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as SavedSongItem[];
  } catch {
    return [];
  }
};

export const isSongSaved = async (song: SaveSongInput): Promise<boolean> => {
  const saved = await getSavedSongs();
  const normalizedTitle = song.title.trim().toLowerCase();
  const normalizedArtist = song.artist.trim().toLowerCase();

  return saved.some((item) => {
    if (song.acrid && item.acrid) {
      return item.acrid === song.acrid;
    }

    return (
      item.title.trim().toLowerCase() === normalizedTitle &&
      item.artist.trim().toLowerCase() === normalizedArtist
    );
  });
};

export const saveSong = async (song: SaveSongInput): Promise<void> => {
  const previous = await getSavedSongs();
  const normalizedTitle = song.title.trim().toLowerCase();
  const normalizedArtist = song.artist.trim().toLowerCase();

  const nextItem: SavedSongItem = {
    id: `${Date.now()}-${song.acrid || normalizedTitle}`,
    title: song.title,
    artist: song.artist,
    album: song.album,
    artwork: song.artwork,
    acrid: song.acrid,
    savedAt: new Date().toISOString(),
  };

  const withoutDuplicate = previous.filter((item) => {
    if (song.acrid && item.acrid) {
      return item.acrid !== song.acrid;
    }

    return !(
      item.title.trim().toLowerCase() === normalizedTitle &&
      item.artist.trim().toLowerCase() === normalizedArtist
    );
  });

  const updated = [nextItem, ...withoutDuplicate].slice(0, MAX_SAVED_ITEMS);
  await AsyncStorage.setItem(SAVED_SONGS_KEY, JSON.stringify(updated));
};

export const deleteSavedSong = async (id: string): Promise<void> => {
  const previous = await getSavedSongs();
  const updated = previous.filter((item) => item.id !== id);
  await AsyncStorage.setItem(SAVED_SONGS_KEY, JSON.stringify(updated));
};
