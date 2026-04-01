// app/screens/SheetMusicScreen.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.EXPO_PUBLIC_SHEET_MUSIC_URL ?? "http://localhost:8000";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Chord voicing map ─────────────────────────────────────────────────────────
type Voicing = { frets: number[]; baseFret?: number };

const CHORD_VOICINGS: Record<string, Voicing> = {
  C:     { frets: [-1, 3, 2, 0, 1, 0] },
  D:     { frets: [-1, -1, 0, 2, 3, 2] },
  E:     { frets: [0, 2, 2, 1, 0, 0] },
  F:     { frets: [1, 1, 2, 3, 3, 1], baseFret: 1 },
  G:     { frets: [3, 2, 0, 0, 0, 3] },
  A:     { frets: [-1, 0, 2, 2, 2, 0] },
  B:     { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2 },
  Cm:    { frets: [-1, 3, 5, 5, 4, 3], baseFret: 3 },
  Dm:    { frets: [-1, -1, 0, 2, 3, 1] },
  Em:    { frets: [0, 2, 2, 0, 0, 0] },
  Fm:    { frets: [1, 1, 1, 3, 3, 1], baseFret: 1 },
  Gm:    { frets: [3, 5, 5, 3, 3, 3], baseFret: 3 },
  Am:    { frets: [-1, 0, 2, 2, 1, 0] },
  Bm:    { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2 },
  "C#":  { frets: [-1, 4, 3, 1, 2, 1], baseFret: 1 },
  Db:    { frets: [-1, 4, 3, 1, 2, 1], baseFret: 1 },
  "C#m": { frets: [-1, 4, 6, 6, 5, 4], baseFret: 4 },
  "D#":  { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1 },
  Eb:    { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1 },
  "D#m": { frets: [-1, -1, 1, 3, 4, 2] },
  Ebm:   { frets: [-1, -1, 1, 3, 4, 2] },
  "F#":  { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  Gb:    { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  "F#m": { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  Gbm:   { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  "G#":  { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  Ab:    { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  "G#m": { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  Abm:   { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  "A#":  { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1 },
  Bb:    { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1 },
  "A#m": { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1 },
  Bbm:   { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1 },
  G7:    { frets: [3, 2, 0, 0, 0, 1] },
  C7:    { frets: [-1, 3, 2, 3, 1, 0] },
  D7:    { frets: [-1, -1, 0, 2, 1, 2] },
  E7:    { frets: [0, 2, 0, 1, 0, 0] },
  A7:    { frets: [-1, 0, 2, 0, 2, 0] },
  B7:    { frets: [-1, 2, 1, 2, 0, 2] },
  Cmaj7: { frets: [-1, 3, 2, 0, 0, 0] },
  Dmaj7: { frets: [-1, -1, 0, 2, 2, 2] },
  Emaj7: { frets: [0, 2, 1, 1, 0, 0] },
  Gmaj7: { frets: [3, 2, 0, 0, 0, 2] },
  Amaj7: { frets: [-1, 0, 2, 1, 2, 0] },
  Am7:   { frets: [-1, 0, 2, 0, 1, 0] },
  Em7:   { frets: [0, 2, 0, 0, 0, 0] },
  Dm7:   { frets: [-1, -1, 0, 2, 1, 1] },
  Bm7:   { frets: [-1, 2, 0, 2, 0, 2] },
};

// ── Chord diagram (pure Views, no SVG) ────────────────────────────────────────
const DIAG_WIDTH = 160;
const FRET_ROWS = 4;
const STRING_COUNT = 6;

function ChordDiagram({ voicing }: { voicing: Voicing }) {
  const baseFret = voicing.baseFret ?? 1;
  const normalised = voicing.frets.map(f => (f <= 0 ? f : f - baseFret + 1));
  const colGap = DIAG_WIDTH / (STRING_COUNT + 1);
  const rowHeight = 22;
  const dotSize = colGap * 0.65;

  return (
    <View style={{ width: DIAG_WIDTH }}>
      {/* Muted / open row */}
      <View style={{ flexDirection: "row", marginBottom: 2 }}>
        <View style={{ width: colGap, alignItems: "center" }}>
          {baseFret > 1 && <Text style={dStyles.baseFretLabel}>{baseFret}fr</Text>}
        </View>
        {normalised.map((fret, i) => (
          <View key={i} style={{ width: colGap, alignItems: "center" }}>
            {fret === -1 && <Text style={dStyles.muted}>✕</Text>}
            {fret === 0  && <View style={dStyles.openCircle} />}
          </View>
        ))}
      </View>
      {/* Nut */}
      {baseFret === 1 && (
        <View style={[dStyles.nut, { marginLeft: colGap, width: colGap * STRING_COUNT }]} />
      )}
      {/* Fret rows */}
      {Array.from({ length: FRET_ROWS }).map((_, fretIdx) => (
        <View key={fretIdx} style={{ height: rowHeight, marginLeft: colGap, width: colGap * STRING_COUNT, position: "relative" }}>
          <View style={dStyles.fretLine} />
          <View style={{ flexDirection: "row", flex: 1 }}>
            {normalised.map((fret, strIdx) => (
              <View key={strIdx} style={{ width: colGap, alignItems: "center", justifyContent: "center", position: "relative" }}>
                <View style={dStyles.stringLine} />
                {fret === fretIdx + 1 && (
                  <View style={[dStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
      {/* Bottom fret line */}
      <View style={[dStyles.fretLine, { marginLeft: colGap, width: colGap * STRING_COUNT, position: "relative" }]} />
    </View>
  );
}

const dStyles = StyleSheet.create({
  baseFretLabel: { fontSize: 9, color: "#aaa" },
  muted:         { fontSize: 11, color: "#888", lineHeight: 14 },
  openCircle:    { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: COLOURS.lightPurple },
  nut:           { height: 5, backgroundColor: COLOURS.brightYellow, borderRadius: 2 },
  fretLine:      { position: "absolute", bottom: 0, left: 0, right: 0, height: 1, backgroundColor: "#555" },
  stringLine:    { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#555", left: "50%" },
  dot:           { backgroundColor: COLOURS.lightPurple, position: "absolute", zIndex: 2 },
});

// ── Chord popup modal ─────────────────────────────────────────────────────────
function ChordModal({ chord, onClose }: { chord: string | null; onClose: () => void }) {
  const voicing = chord ? CHORD_VOICINGS[chord] : null;
  return (
    <Modal visible={!!chord} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable style={modalStyles.card} onPress={e => e.stopPropagation()}>
          <Text style={modalStyles.chordName}>{chord}</Text>
          {voicing
            ? <ChordDiagram voicing={voicing} />
            : <Text style={modalStyles.noVoicing}>No diagram available</Text>
          }
          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <Text style={modalStyles.closeTxt}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: COLOURS.primaryPurple, borderRadius: 20,
    padding: 24, alignItems: "center", gap: 16,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 20,
  },
  chordName: { fontFamily: "Inter_700Bold", fontSize: 28, color: COLOURS.brightYellow },
  noVoicing: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLOURS.lightPurple, opacity: 0.7 },
  closeBtn:  { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLOURS.lightPurple, borderRadius: 12 },
  closeTxt:  { fontFamily: "Inter_700Bold", fontSize: 14, color: COLOURS.darkBackground },
});

// ── Chord pill (tappable, shown above lyric line) ─────────────────────────────
function ChordPill({ chord, onPress }: { chord: string; onPress: () => void }) {
  const hasVoicing = !!CHORD_VOICINGS[chord];
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[pillStyles.pill, !hasVoicing && pillStyles.pillDim]}
      activeOpacity={0.7}
    >
      <Text style={pillStyles.pillText}>{chord}</Text>
      {hasVoicing && <View style={pillStyles.dot} />}
    </TouchableOpacity>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    backgroundColor: COLOURS.primaryPurple,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    marginRight: 6, marginBottom: 4,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  pillDim:    { opacity: 0.5 },
  pillText:   { fontFamily: "Inter_700Bold", fontSize: 12, color: COLOURS.brightYellow },
  dot:        { width: 4, height: 4, borderRadius: 2, backgroundColor: COLOURS.lightPurple },
});

// ── Lyric line ────────────────────────────────────────────────────────────────
function LyricLine({
  line,
  onChordPress,
}: {
  line: { time: number; text: string; chords: string[] };
  onChordPress: (chord: string) => void;
}) {
  return (
    <View style={lyricStyles.container}>
      {/* Chord pills row */}
      {line.chords.length > 0 && (
        <View style={lyricStyles.chordsRow}>
          {line.chords.map((ch, i) => (
            <ChordPill key={i} chord={ch} onPress={() => onChordPress(ch)} />
          ))}
        </View>
      )}
      {/* Lyric text */}
      {line.text ? (
        <Text style={lyricStyles.text}>{line.text}</Text>
      ) : null}
    </View>
  );
}

const lyricStyles = StyleSheet.create({
  container:  { marginBottom: 14 },
  chordsRow:  { flexDirection: "row", flexWrap: "wrap", marginBottom: 2 },
  text:       { fontFamily: "Inter_400Regular", fontSize: 16, color: "#fff", lineHeight: 24 },
});

// ── Chord reference strip at top ──────────────────────────────────────────────
function ChordStrip({
  chords,
  onChordPress,
}: {
  chords: string[];
  onChordPress: (chord: string) => void;
}) {
  return (
    <View style={stripStyles.container}>
      <Text style={stripStyles.label}>CHORDS USED</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={stripStyles.row}>
          {chords.map(ch => (
            <ChordPill key={ch} chord={ch} onPress={() => onChordPress(ch)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const stripStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.2, color: COLOURS.lightPurple, marginBottom: 8 },
  row:   { flexDirection: "row", flexWrap: "nowrap" },
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface LyricLineData { time: number; text: string; chords: string[] }
interface ApiResponse {
  song_name: string;
  artist: string;
  has_lyrics: boolean;
  lines: LyricLineData[];
  all_chords: string[];
}
type Status = "loading" | "done" | "error";

const pickParam = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ title?: string | string[]; artist?: string | string[] }>();

  const title  = pickParam(params.title)  ?? "Unknown Song";
  const artist = pickParam(params.artist) ?? "Unknown Artist";

  const [status, setStatus]         = useState<Status>("loading");
  const [data, setData]             = useState<ApiResponse | null>(null);
  const [errorMsg, setErrorMsg]     = useState("");
  const [activeChord, setActiveChord] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/chords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_name: title, artist }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? `Server error ${res.status}`);
        }
        const json: ApiResponse = await res.json();
        if (!cancelled) { setData(json); setStatus("done"); }
      } catch (e: any) {
        if (!cancelled) { setErrorMsg(e.message ?? "Something went wrong."); setStatus("error"); }
      }
    }
    void fetchData();
    return () => { cancelled = true; };
  }, [title, artist]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.subtitle} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.titleText, { color: colors.title }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.artistText, { color: colors.subtitle }]} numberOfLines={1}>{artist}</Text>
        </View>
      </View>

      {/* Loading */}
      {status === "loading" && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLOURS.lightPurple} />
          <Text style={[styles.statusText, { color: colors.subtitle }]}>Analysing song…</Text>
          <Text style={[styles.hintText,   { color: colors.subtitle }]}>This can take 30–90 seconds</Text>
        </View>
      )}

      {/* Error */}
      {status === "error" && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Could not load song</Text>
          <Text style={[styles.hintText, { color: colors.subtitle }]}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton}
            onPress={() => { setStatus("loading"); setData(null); }}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {status === "done" && data && (
        <>
          {/* Chord reference strip */}
          <ChordStrip
            chords={data.all_chords.sort()}
            onChordPress={setActiveChord}
          />

          {!data.has_lyrics && (
            <View style={styles.noLyricsBanner}>
              <Ionicons name="information-circle-outline" size={14} color={COLOURS.lightPurple} />
              <Text style={styles.noLyricsText}>
                Lyrics not found — showing chord progression only
              </Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {data.lines.map((line, i) => (
              <LyricLine key={i} line={line} onChordPress={setActiveChord} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Chord diagram popup */}
      <ChordModal chord={activeChord} onClose={() => setActiveChord(null)} />

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton:    { width: 40, height: 40, justifyContent: "center" },
  headerText:    { flex: 1 },
  titleText:     { fontFamily: "Inter_700Bold", fontSize: 17 },
  artistText:    { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  centered: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12,
  },
  statusText:    { fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 12 },
  hintText:      { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", opacity: 0.6 },
  errorTitle:    { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FF6B6B", marginTop: 8 },
  retryButton: {
    marginTop: 8, backgroundColor: COLOURS.lightPurple,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
  },
  retryText:     { fontFamily: "Inter_700Bold", fontSize: 15, color: COLOURS.darkBackground },
  noLyricsBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  noLyricsText: {
    fontFamily: "Inter_400Regular", fontSize: 12,
    color: COLOURS.lightPurple, opacity: 0.8,
  },
  scroll:        { padding: 16, paddingBottom: 48 },
});