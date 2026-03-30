// app/(tabs)/tuner.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import {
  AudioQuality,
  RecordingOptions,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Instrument data ───────────────────────────────────────────────────────────

type InstrumentString = {
  string: number;
  note: string;
  octave: number;
  label: string;
  frequency: number;
  thickness: number;
  color: string;
};

type Instrument = {
  id: string;
  name: string;
  tuning: string;
  strings: InstrumentString[];
};

const INSTRUMENTS: Instrument[] = [
  {
    id: "guitar_std",
    name: "Guitar",
    tuning: "Standard",
    strings: [
      { string: 6, note: "E", octave: 2, label: "Low E",  frequency: 82.41,  thickness: 7, color: "#C9813A" },
      { string: 5, note: "A", octave: 2, label: "A",      frequency: 110.00, thickness: 6, color: "#C9A83A" },
      { string: 4, note: "D", octave: 3, label: "D",      frequency: 146.83, thickness: 5, color: "#6BAF6B" },
      { string: 3, note: "G", octave: 3, label: "G",      frequency: 196.00, thickness: 4, color: "#4BBCE8" },
      { string: 2, note: "B", octave: 3, label: "B",      frequency: 246.94, thickness: 3, color: "#7B8FE8" },
      { string: 1, note: "E", octave: 4, label: "High E", frequency: 329.63, thickness: 2, color: "#C07BE8" },
    ],
  },
  {
    id: "guitar_dropd",
    name: "Guitar",
    tuning: "Drop D",
    strings: [
      { string: 6, note: "D", octave: 2, label: "Drop D", frequency: 73.42,  thickness: 7, color: "#C9813A" },
      { string: 5, note: "A", octave: 2, label: "A",      frequency: 110.00, thickness: 6, color: "#C9A83A" },
      { string: 4, note: "D", octave: 3, label: "D",      frequency: 146.83, thickness: 5, color: "#6BAF6B" },
      { string: 3, note: "G", octave: 3, label: "G",      frequency: 196.00, thickness: 4, color: "#4BBCE8" },
      { string: 2, note: "B", octave: 3, label: "B",      frequency: 246.94, thickness: 3, color: "#7B8FE8" },
      { string: 1, note: "E", octave: 4, label: "High E", frequency: 329.63, thickness: 2, color: "#C07BE8" },
    ],
  },
  {
    id: "bass_std",
    name: "Bass",
    tuning: "Standard",
    strings: [
      { string: 4, note: "E", octave: 1, label: "Low E", frequency: 41.20, thickness: 7, color: "#C9813A" },
      { string: 3, note: "A", octave: 1, label: "A",     frequency: 55.00, thickness: 6, color: "#C9A83A" },
      { string: 2, note: "D", octave: 2, label: "D",     frequency: 73.42, thickness: 5, color: "#6BAF6B" },
      { string: 1, note: "G", octave: 2, label: "G",     frequency: 98.00, thickness: 4, color: "#4BBCE8" },
    ],
  },
  {
    id: "ukulele_std",
    name: "Ukulele",
    tuning: "Standard",
    strings: [
      { string: 4, note: "G", octave: 4, label: "G",  frequency: 392.00, thickness: 3, color: "#4BBCE8" },
      { string: 3, note: "C", octave: 4, label: "C",  frequency: 261.63, thickness: 5, color: "#6BAF6B" },
      { string: 2, note: "E", octave: 4, label: "E",  frequency: 329.63, thickness: 4, color: "#D4B800" },
      { string: 1, note: "A", octave: 4, label: "A",  frequency: 440.00, thickness: 2, color: "#C9A83A" },
    ],
  },
  {
    id: "violin_std",
    name: "Violin",
    tuning: "Standard",
    strings: [
      { string: 4, note: "G", octave: 3, label: "G", frequency: 196.00, thickness: 5, color: "#4BBCE8" },
      { string: 3, note: "D", octave: 4, label: "D", frequency: 293.66, thickness: 4, color: "#6BAF6B" },
      { string: 2, note: "A", octave: 4, label: "A", frequency: 440.00, thickness: 3, color: "#C9A83A" },
      { string: 1, note: "E", octave: 5, label: "E", frequency: 659.25, thickness: 2, color: "#C07BE8" },
    ],
  },
];

// ── Recording options (PCM for pitch detection) ────────────────────────────────

const SAMPLE_RATE = 22050;

const PCM_RECORDING_OPTIONS: RecordingOptions = {
  extension: ".wav",
  sampleRate: SAMPLE_RATE,
  numberOfChannels: 1,
  bitRate: SAMPLE_RATE * 16,
  ios: {
    extension: ".wav",
    outputFormat: "lpcm",
    sampleRate: SAMPLE_RATE,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    extension: ".wav",
    outputFormat: "default",
    audioEncoder: "default",
    sampleRate: SAMPLE_RATE,
  },
  web: { mimeType: "audio/wav", bitsPerSecond: SAMPLE_RATE * 16 },
};

// ── WAV synthesis (reference tones) ──────────────────────────────────────────

function makeGuitarWAV(frequency: number): Uint8Array {
  const sampleRate = 22050;
  const duration = 1.8;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF"); v.setUint32(4, 36 + dataSize, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, dataSize, true);
  const attackSamples = Math.floor(sampleRate * 0.004);
  const f = frequency;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wave = Math.sin(2 * Math.PI * f * t)
      + 0.5  * Math.sin(2 * Math.PI * 2 * f * t)
      + 0.25 * Math.sin(2 * Math.PI * 3 * f * t)
      + 0.12 * Math.sin(2 * Math.PI * 4 * f * t)
      + 0.06 * Math.sin(2 * Math.PI * 5 * f * t);
    let env = Math.exp(-2.2 * t);
    if (i < attackSamples) env *= i / attackSamples;
    v.setInt16(44 + i * 2, Math.round((wave / 1.93) * 28000 * env), true);
  }
  return new Uint8Array(buf);
}

function ensureStringFile(key: string, frequency: number): string {
  const file = new File(Paths.cache, `tuner_${key}.wav`);
  if (!file.exists) file.write(makeGuitarWAV(frequency));
  return file.uri;
}

// ── Pitch detection ───────────────────────────────────────────────────────────

function parseWAVSamples(bytes: Uint8Array): Int16Array | null {
  if (bytes.length < 44) return null;
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const wave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff !== "RIFF" || wave !== "WAVE") return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);
    const dv = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4);
    const chunkSize = dv.getUint32(0, true);
    if (id === "data") {
      const dataStart = offset + 8;
      const n = Math.floor(Math.min(chunkSize, bytes.length - dataStart) / 2);
      const samples = new Int16Array(n);
      const sdv = new DataView(bytes.buffer, bytes.byteOffset + dataStart);
      for (let i = 0; i < n; i++) samples[i] = sdv.getInt16(i * 2, true);
      return samples;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return null;
}

/**
 * Normalized autocorrelation (NSDF) pitch detection.
 * Wide frequency range to cover bass (41 Hz) through violin (659 Hz).
 */
function detectPitch(samples: Int16Array, sampleRate: number): number | null {
  const WINDOW = 2048;
  const MIN_FREQ = 35;   // below bass Low E (41 Hz)
  const MAX_FREQ = 700;  // above violin High E (659 Hz)
  const MIN_LAG = Math.floor(sampleRate / MAX_FREQ);
  const MAX_LAG = Math.ceil(sampleRate / MIN_FREQ);

  if (samples.length < WINDOW + MAX_LAG) return null;

  const start = Math.floor((samples.length - WINDOW) / 2);
  const s = new Float32Array(WINDOW);
  let rms = 0;
  for (let i = 0; i < WINDOW; i++) {
    s[i] = samples[start + i] / 32768;
    rms += s[i] * s[i];
  }
  rms = Math.sqrt(rms / WINDOW);
  if (rms < 0.02) return null;

  let bestLag = -1;
  let bestVal = -Infinity;
  for (let lag = MIN_LAG; lag <= MAX_LAG; lag++) {
    let num = 0, den = 0;
    for (let i = 0; i < WINDOW - lag; i++) {
      num += s[i] * s[i + lag];
      den += s[i] * s[i] + s[i + lag] * s[i + lag];
    }
    const nsdf = den > 0 ? 2 * num / den : 0;
    if (nsdf > bestVal) { bestVal = nsdf; bestLag = lag; }
  }

  if (bestLag < 0 || bestVal < 0.4) return null;

  if (bestLag > MIN_LAG && bestLag < MAX_LAG) {
    let prev = 0, curr = 0, next = 0;
    for (let i = 0; i < WINDOW - bestLag; i++) {
      prev += s[i] * s[i + bestLag - 1];
      curr += s[i] * s[i + bestLag];
      next += s[i] * s[i + bestLag + 1];
    }
    const correction = (prev - next) / (2 * (prev - 2 * curr + next));
    if (isFinite(correction)) return sampleRate / (bestLag + correction);
  }
  return sampleRate / bestLag;
}

function frequencyToCents(detected: number, target: number): number {
  return 1200 * Math.log2(detected / target);
}

function findNearestString(freq: number, strings: InstrumentString[]): InstrumentString {
  return strings.reduce((best, s) =>
    Math.abs(frequencyToCents(freq, s.frequency)) <
    Math.abs(frequencyToCents(freq, best.frequency)) ? s : best
  );
}

// ── Tuner needle helpers ──────────────────────────────────────────────────────

const CENTS_RANGE = 50;

function centsColor(cents: number): string {
  const abs = Math.abs(cents);
  if (abs <= 5)  return "#4CAF75";
  if (abs <= 15) return "#E8C44B";
  return "#E84B6E";
}

// ── Component ─────────────────────────────────────────────────────────────────

type Mode = "reference" | "tune";

export default function TunerScreen() {
  const { colors, isLight } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // ── Instrument ──
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>(INSTRUMENTS[0]);
  const instrumentRef = useRef<Instrument>(INSTRUMENTS[0]);

  // ── Mode ──
  const [mode, setMode] = useState<Mode>("reference");

  // ── Reference tone playback ──
  const stringUris = useRef<Record<string, string>>({});
  const [tonesReady, setTonesReady] = useState(false);
  const [playingString, setPlayingString] = useState<number | null>(null);
  const player = useAudioPlayer(null);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tuneTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [tuningAll, setTuningAll] = useState(false);

  // ── Mic tuning ──
  const recorder = useAudioRecorder(PCM_RECORDING_OPTIONS);
  const [listening, setListening] = useState(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [centsOff, setCentsOff] = useState<number | null>(null);
  const [nearestString, setNearestString] = useState<InstrumentString | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const isRunningRef = useRef(false);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Selected string (null = auto-detect nearest) ──
  const [selectedString, setSelectedString] = useState<InstrumentString | null>(null);
  const selectedStringRef = useRef<InstrumentString | null>(null);
  useEffect(() => {
    selectedStringRef.current = selectedString;
    setDetectedFreq(null);
    setCentsOff(null);
    setNearestString(selectedString);
  }, [selectedString]);

  // Pre-generate tones for all instruments on mount
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
    const uris: Record<string, string> = {};
    for (const inst of INSTRUMENTS) {
      for (const s of inst.strings) {
        const key = `${inst.id}_s${s.string}`;
        uris[key] = ensureStringFile(key, s.frequency);
      }
    }
    stringUris.current = uris;
    setTonesReady(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    };
  }, []);

  function selectInstrument(inst: Instrument) {
    if (listening) void stopListening();
    stopTuneAll();
    setSelectedInstrument(inst);
    instrumentRef.current = inst;
    setSelectedString(null);
    setDetectedFreq(null);
    setCentsOff(null);
    setNearestString(null);
  }

  // ── Reference: play a single string ──
  function playString(stringNum: number) {
    const key = `${selectedInstrument.id}_s${stringNum}`;
    const uri = stringUris.current[key];
    if (!uri) return;
    player.replace({ uri });
    player.play();
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    setPlayingString(stringNum);
    playTimerRef.current = setTimeout(() => setPlayingString(null), 1800);
  }

  function stopTuneAll() {
    tuneTimersRef.current.forEach(clearTimeout);
    tuneTimersRef.current = [];
    setTuningAll(false);
    setPlayingString(null);
  }

  function tuneAll() {
    if (tuningAll) { stopTuneAll(); return; }
    if (!tonesReady) return;
    setTuningAll(true);
    selectedInstrument.strings.forEach((s, i) => {
      const t = setTimeout(() => {
        playString(s.string);
        if (i === selectedInstrument.strings.length - 1) {
          const done = setTimeout(() => setTuningAll(false), 1800);
          tuneTimersRef.current.push(done);
        }
      }, i * 2000);
      tuneTimersRef.current.push(t);
    });
  }

  // ── Mic: analyse one recording chunk ──
  const analyzeChunk = useCallback(async (uri: string) => {
    try {
      const file = new File(uri);
      const bytes = await file.bytes();
      const samples = parseWAVSamples(bytes);
      if (!samples) { setDetectedFreq(null); setCentsOff(null); return; }

      const freq = detectPitch(samples, SAMPLE_RATE);
      if (freq === null) {
        setDetectedFreq(null);
        setCentsOff(null);
        setNearestString(null);
        return;
      }

      const target = selectedStringRef.current ?? findNearestString(freq, instrumentRef.current.strings);
      const cents = frequencyToCents(freq, target.frequency);
      setDetectedFreq(freq);
      setNearestString(target);
      setCentsOff(cents);
    } catch {
      // Silently swallow file-read errors between chunks
    }
  }, []);

  // ── Mic: recording loop ──
  const runLoop = useCallback(async () => {
    if (!isRunningRef.current) return;
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      loopTimerRef.current = setTimeout(async () => {
        if (!isRunningRef.current) return;
        try {
          await recorder.stop();
          const uri = recorder.uri;
          if (uri) await analyzeChunk(uri);
        } catch {}
        if (isRunningRef.current) runLoop();
      }, 450);
    } catch {
      if (isRunningRef.current) {
        loopTimerRef.current = setTimeout(() => runLoop(), 600);
      }
    }
  }, [recorder, analyzeChunk]);

  async function startListening() {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) { setPermissionDenied(true); return; }
    setPermissionDenied(false);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    isRunningRef.current = true;
    setListening(true);
    setDetectedFreq(null);
    setCentsOff(null);
    setNearestString(null);
    void runLoop();
  }

  async function stopListening() {
    isRunningRef.current = false;
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    setListening(false);
    try {
      if (recorder.isRecording) await recorder.stop();
    } catch {}
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  }

  function switchMode(next: Mode) {
    if (next === "reference" && listening) void stopListening();
    setMode(next);
  }

  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.06)";
  const toggleBg = isLight ? "#E2DBCC" : COLOURS.primaryPurple;

  const inTune = centsOff !== null && Math.abs(centsOff) <= 5;
  const needlePercent = centsOff !== null
    ? Math.max(0, Math.min(1, (Math.min(Math.max(centsOff, -CENTS_RANGE), CENTS_RANGE) + CENTS_RANGE) / (CENTS_RANGE * 2)))
    : 0.5;
  const tunerColor = centsOff !== null ? centsColor(centsOff) : colors.border;
  const tunerStatus =
    !listening              ? "Tap listen to start"
    : detectedFreq === null ? "Pluck a string…"
    : inTune                ? "In Tune!"
    : (centsOff ?? 0) < 0  ? "Tune Up (Flat)"
                            : "Tune Down (Sharp)";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }, isLandscape && styles.containerLandscape]}
    >
      {/* Header */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <Text style={[styles.title, { color: colors.title }, isLandscape && styles.titleLandscape]}>
          Tuner
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtitle }]}>
          {selectedInstrument.name} — {selectedInstrument.tuning}
        </Text>
      </View>

      {/* Instrument picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.instrScroll}
        contentContainerStyle={styles.instrRow}
      >
        {INSTRUMENTS.map((inst) => {
          const isActive = selectedInstrument.id === inst.id;
          return (
            <TouchableOpacity
              key={inst.id}
              style={[
                styles.instrChip,
                { borderColor: isActive ? COLOURS.brightYellow : colors.border },
                isActive && { backgroundColor: COLOURS.brightYellow },
              ]}
              onPress={() => selectInstrument(inst)}
              activeOpacity={0.75}
            >
              <Text style={[styles.instrChipName, { color: isActive ? COLOURS.darkBackground : colors.title }]}>
                {inst.name}
              </Text>
              <Text style={[styles.instrChipTuning, { color: isActive ? COLOURS.darkBackground + "BB" : colors.subtitle }]}>
                {inst.tuning}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Mode toggle */}
      <View style={[styles.modeToggle, { backgroundColor: toggleBg }]}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "reference" && styles.modeBtnActive]}
          onPress={() => switchMode("reference")}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeBtnTxt, { color: COLOURS.lightPurple }, mode === "reference" && styles.modeBtnTxtActive]}>
            Reference
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "tune" && styles.modeBtnActive]}
          onPress={() => switchMode("tune")}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeBtnTxt, { color: COLOURS.lightPurple }, mode === "tune" && styles.modeBtnTxtActive]}>
            Listen &amp; Tune
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "reference" ? (
        /* ── REFERENCE MODE ── */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: isLandscape ? 74 : 104 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <Text style={[styles.sectionLabel, { color: colors.subtitle }]}>
              {tonesReady ? "Tap a string to hear it" : "Loading tones…"}
            </Text>
            <TouchableOpacity
              style={[styles.tuneAllBtn, { borderColor: tuningAll ? COLOURS.brightYellow : colors.border }, tuningAll && { backgroundColor: "rgba(249,239,189,0.12)" }]}
              onPress={tuneAll}
              disabled={!tonesReady}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={tuningAll ? "Stop tune all" : "Tune all strings"}
              accessibilityHint="Plays reference tones for each string in sequence"
            >
              <Ionicons name={tuningAll ? "stop" : "play"} size={13} color={tuningAll ? COLOURS.brightYellow : colors.subtitle} />
              <Text style={[styles.tuneAllTxt, { color: tuningAll ? COLOURS.brightYellow : colors.subtitle }]}>
                {tuningAll ? "Stop" : "Tune All"}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedInstrument.strings.map((s) => {
            const isPlaying = playingString === s.string;
            return (
              <TouchableOpacity
                key={s.string}
                style={[styles.stringCard, { backgroundColor: cardBg }, isPlaying && { backgroundColor: s.color + "18", borderColor: s.color, borderWidth: 1.5 }]}
                onPress={() => playString(s.string)}
                activeOpacity={0.75}
                disabled={!tonesReady}
              >
                <View style={[styles.stringBadge, { backgroundColor: s.color + "22", borderColor: s.color + "55" }]}>
                  <Text style={[styles.stringNum, { color: s.color }]}>{s.string}</Text>
                </View>
                <View style={styles.stringLineWrap}>
                  <View style={[styles.stringLine, { height: s.thickness, backgroundColor: isPlaying ? s.color : s.color + "88", borderRadius: s.thickness / 2 }]} />
                </View>
                <View style={styles.noteInfo}>
                  <Text style={[styles.noteName, { color: isPlaying ? s.color : colors.title }]}>
                    {s.note}<Text style={[styles.noteOctave, { color: colors.subtitle }]}>{s.octave}</Text>
                  </Text>
                  <Text style={[styles.noteLabel, { color: colors.subtitle }]}>{s.label}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={[styles.freqText, { color: colors.subtitle }]}>{s.frequency.toFixed(2)} Hz</Text>
                  <Ionicons name={isPlaying ? "volume-high" : "volume-medium-outline"} size={16} color={isPlaying ? s.color : s.color + "77"} />
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.tipCard, { backgroundColor: isLight ? "rgba(78,76,127,0.08)" : "rgba(168,170,214,0.08)", borderColor: isLight ? COLOURS.primaryPurple + "33" : COLOURS.lightPurple + "33" }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.subtitle} style={{ marginTop: 1 }} />
            <Text style={[styles.tipText, { color: colors.subtitle }]}>
              Play each string and tune it until it matches the reference tone.
            </Text>
          </View>
        </ScrollView>
      ) : (
        /* ── LISTEN & TUNE MODE ── */
        <View style={styles.tuneContainer}>
          {/* String selector */}
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[styles.selectorChip, selectedString === null && styles.selectorChipAutoActive]}
              onPress={() => setSelectedString(null)}
              activeOpacity={0.75}
            >
              <Text style={[styles.selectorChipTxt, { color: selectedString === null ? COLOURS.darkBackground : colors.subtitle }]}>
                Auto
              </Text>
            </TouchableOpacity>
            {selectedInstrument.strings.map((s) => {
              const isSelected = selectedString?.string === s.string;
              return (
                <TouchableOpacity
                  key={s.string}
                  style={[
                    styles.selectorChip,
                    { borderColor: s.color + "66" },
                    isSelected && { backgroundColor: s.color, borderColor: s.color },
                  ]}
                  onPress={() => setSelectedString(isSelected ? null : s)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.selectorChipNum, { color: isSelected ? "#fff" : s.color }]}>
                    {s.string}
                  </Text>
                  <Text style={[styles.selectorChipNote, { color: isSelected ? "rgba(255,255,255,0.75)" : s.color + "AA" }]}>
                    {s.note}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tuner display card — listen button lives inside */}
          <View style={[styles.tunerCard, { backgroundColor: COLOURS.primaryPurple }]}>

            {/* Detected note */}
            <Text style={[styles.tunerNote, { color: nearestString ? nearestString.color : COLOURS.lightPurple }]}>
              {nearestString ? nearestString.note : "—"}
              {nearestString && (
                <Text style={[styles.tunerOctave, { color: COLOURS.lightPurple }]}>
                  {nearestString.octave}
                </Text>
              )}
            </Text>

            <Text style={[styles.tunerStringLabel, { color: COLOURS.lightPurple }]}>
              {selectedString
                ? `String ${selectedString.string} · ${selectedString.label} (locked)`
                : nearestString
                  ? `String ${nearestString.string} · ${nearestString.label} · Auto`
                  : "Select a string or play one"}
            </Text>

            {/* Cents meter */}
            <View style={styles.meterWrap}>
              <View style={[styles.meterTrack, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                <View style={styles.meterCentre} />
                {centsOff !== null && (
                  <View
                    style={[
                      styles.meterNeedle,
                      {
                        left: `${needlePercent * 100}%` as `${number}%`,
                        backgroundColor: tunerColor,
                        shadowColor: tunerColor,
                        shadowOpacity: 0.8,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 6,
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.meterLabels}>
                <Text style={[styles.meterLabel, { color: COLOURS.lightPurple }]}>♭ Flat</Text>
                <Text style={[styles.meterLabel, { color: COLOURS.lightPurple }]}>Sharp ♯</Text>
              </View>
            </View>

            {/* Status + cents value */}
            <View style={styles.tunerStatusRow}>
              <Text style={[styles.tunerStatus, { color: inTune ? "#4CAF75" : COLOURS.brightYellow }]}>
                {tunerStatus}
              </Text>
              {centsOff !== null && (
                <Text style={[styles.tunerCents, { color: tunerColor }]}>
                  {centsOff > 0 ? "+" : ""}{centsOff.toFixed(1)} ¢
                </Text>
              )}
            </View>

            {detectedFreq !== null && (
              <Text style={[styles.tunerFreq, { color: COLOURS.lightPurple }]}>
                {detectedFreq.toFixed(1)} Hz · target {nearestString?.frequency.toFixed(2)} Hz
              </Text>
            )}

            {/* Listen button — inside the card */}
            <TouchableOpacity
              style={[styles.listenBtn, listening && styles.listenBtnActive]}
              onPress={listening ? stopListening : startListening}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={listening ? "Stop listening" : "Start listening"}
              accessibilityHint="Starts or stops microphone tuning mode"
            >
              <Ionicons
                name={listening ? "stop-circle" : "mic"}
                size={22}
                color={COLOURS.darkBackground}
              />
              <Text style={styles.listenBtnTxt}>
                {listening ? "Stop Listening" : "Start Listening"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Permission denied warning */}
          {permissionDenied && (
            <View style={[styles.tipCard, { backgroundColor: "#E84B6E22", borderColor: "#E84B6E55", marginTop: 10 }]}>
              <Ionicons name="warning-outline" size={16} color="#E84B6E" style={{ marginTop: 1 }} />
              <Text style={[styles.tipText, { color: colors.title }]}>
                Microphone permission is required. Please enable it in Settings.
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  containerLandscape: { paddingHorizontal: 18 },

  header: { marginTop: 12, marginBottom: 8 },
  headerLandscape: { marginTop: 10, marginBottom: 8, flexDirection: "row", alignItems: "baseline", gap: 12 },
  title: { fontSize: 48, fontFamily: "WinkyMilky", letterSpacing: 1 },
  titleLandscape: { fontSize: 34 },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 4 },

  // Instrument picker
  instrScroll: { flexGrow: 0, marginBottom: 12 },
  instrRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  instrChip: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: "center",
  },
  instrChipName: { fontFamily: "Inter_700Bold", fontSize: 13 },
  instrChipTuning: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },

  // Mode toggle
  modeToggle: { flexDirection: "row", borderRadius: 16, padding: 4, marginBottom: 12 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  modeBtnActive: { backgroundColor: COLOURS.brightYellow },
  modeBtnTxt: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  modeBtnTxtActive: { color: COLOURS.darkBackground },

  content: { paddingTop: 2 },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  tuneAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tuneAllTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },

  // String cards (reference mode)
  stringCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, marginBottom: 6, paddingVertical: 9, paddingHorizontal: 12, gap: 10 },
  stringBadge: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stringNum: { fontFamily: "Inter_700Bold", fontSize: 12 },
  stringLineWrap: { width: 32, justifyContent: "center", alignItems: "center" },
  stringLine: { width: "100%" },
  noteInfo: { flex: 1 },
  noteName: { fontFamily: "Inter_700Bold", fontSize: 20, lineHeight: 24 },
  noteOctave: { fontFamily: "Inter_400Regular", fontSize: 11 },
  noteLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  rightCol: { alignItems: "flex-end", gap: 4, minWidth: 72 },
  freqText: { fontFamily: "Inter_400Regular", fontSize: 12 },

  // Tune mode layout
  tuneContainer: { flex: 1 },

  // String selector chips
  selectorRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  selectorChip: { borderWidth: 1.5, borderColor: "rgba(168,170,214,0.4)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5, alignItems: "center", flex: 1 },
  selectorChipAutoActive: { backgroundColor: COLOURS.brightYellow, borderColor: COLOURS.brightYellow },
  selectorChipTxt: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  selectorChipNum: { fontFamily: "Inter_700Bold", fontSize: 13, lineHeight: 16 },
  selectorChipNote: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 13 },

  // Tuner card
  tunerCard: { borderRadius: 24, padding: 16, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  tunerNote: { fontFamily: "WinkyMilky", fontSize: 58, lineHeight: 66 },
  tunerOctave: { fontFamily: "Inter_400Regular", fontSize: 20 },
  tunerStringLabel: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2, marginBottom: 12 },

  // Cents meter
  meterWrap: { width: "100%", marginBottom: 10 },
  meterTrack: { height: 12, borderRadius: 6, position: "relative", justifyContent: "center", marginBottom: 6 },
  meterCentre: { position: "absolute", left: "50%", width: 2, height: 20, marginTop: -4, marginLeft: -1, backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 1 },
  meterNeedle: { position: "absolute", width: 4, height: 28, borderRadius: 2, marginTop: -8, marginLeft: -2, top: "50%" },
  meterLabels: { flexDirection: "row", justifyContent: "space-between" },
  meterLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },

  tunerStatusRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  tunerStatus: { fontFamily: "Inter_700Bold", fontSize: 15 },
  tunerCents: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  tunerFreq: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2, marginBottom: 4 },

  // Listen button (inside the card)
  listenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLOURS.brightYellow, borderRadius: 18, paddingVertical: 14, marginTop: 12, width: "100%" },
  listenBtnActive: { backgroundColor: "#E84B6E" },
  listenBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLOURS.darkBackground },

  // Tip / warning card
  tipCard: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 6 },
  tipText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
});
