// app/(tabs)/practice.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Solfège data ──────────────────────────────────────────────────────────────

const SOLFEGE_SCALE = [
  { syllable: "Do", note: "C", frequency: 261.63, color: "#E84B6E" },
  { syllable: "Re", note: "D", frequency: 293.66, color: "#E8854B" },
  { syllable: "Mi", note: "E", frequency: 329.63, color: "#D4B800" },
  { syllable: "Fa", note: "F", frequency: 349.23, color: "#4CAF75" },
  { syllable: "Sol", note: "G", frequency: 392.0, color: "#4BBCE8" },
  { syllable: "La", note: "A", frequency: 440.0, color: "#5B7CE8" },
  { syllable: "Ti", note: "B", frequency: 493.88, color: "#9C4BE8" },
];

// ── WAV synthesis ─────────────────────────────────────────────────────────────

/** Generates a 16-bit mono PCM WAV with harmonics and a natural decay envelope. */
function makeNoteWAV(frequency: number): Uint8Array {
  const sampleRate = 22050;
  const duration = 1.0;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;

  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);

  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, dataSize, true);

  const attackSamples = Math.floor(sampleRate * 0.006);
  const f = frequency;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const wave =
      Math.sin(2 * Math.PI * f * t) +
      0.45 * Math.sin(2 * Math.PI * 2 * f * t) +
      0.2 * Math.sin(2 * Math.PI * 3 * f * t) +
      0.08 * Math.sin(2 * Math.PI * 4 * f * t);
    let env = Math.exp(-3.5 * t);
    if (i < attackSamples) env *= i / attackSamples;
    v.setInt16(44 + i * 2, Math.round((wave / 1.73) * 28000 * env), true);
  }

  return new Uint8Array(buf);
}

function ensureNoteFile(note: string, frequency: number): string {
  const file = new File(Paths.cache, `solfege_${note}.wav`);
  if (!file.exists) {
    file.write(makeNoteWAV(frequency));
  }
  return file.uri;
}

// ── Quiz helpers ──────────────────────────────────────────────────────────────

type Mode = "reference" | "quiz";
type QuizType = "noteToSolfege" | "solfegeToNote";
type ScaleItem = (typeof SOLFEGE_SCALE)[0];

type Question = {
  correct: ScaleItem;
  answers: ScaleItem[];
  questionText: string;
  prompt: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestion(type: QuizType): Question {
  const correctIdx = Math.floor(Math.random() * SOLFEGE_SCALE.length);
  const correct = SOLFEGE_SCALE[correctIdx];
  const answers = shuffle([
    ...shuffle(SOLFEGE_SCALE.filter((_, i) => i !== correctIdx)).slice(0, 3),
    correct,
  ]);
  return {
    correct,
    answers,
    questionText: type === "noteToSolfege" ? correct.note : correct.syllable,
    prompt:
      type === "noteToSolfege"
        ? "Which solfège syllable?"
        : "Which note is this?",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PracticeScreen() {
  const router = useRouter();
  const { colors, isLight } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [mode, setMode] = useState<Mode>("reference");
  const [quizType, setQuizType] = useState<QuizType>("noteToSolfege");
  const [question, setQuestion] = useState<Question>(() =>
    generateQuestion("noteToSolfege"),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });

  // Note URIs — populated once on mount
  const noteUris = useRef<Record<string, string>>({});
  const [notesReady, setNotesReady] = useState(false);

  // Single player instance, source swapped via replace()
  const player = useAudioPlayer(null);

  // Cache WAV files + configure audio session
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
    const results: Record<string, string> = {};
    for (const item of SOLFEGE_SCALE) {
      results[item.note] = ensureNoteFile(item.note, item.frequency);
    }
    // High Do (C5 — one octave above C4)
    results["C5"] = ensureNoteFile("C5", 523.25);
    noteUris.current = results;
    setNotesReady(true);
  }, []);

  // Highlight state for the reference cards
  const [playingNote, setPlayingNote] = useState<string | null>(null);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scale playback state
  const [playingScale, setPlayingScale] = useState(false);
  const scaleTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function playNote(note: string) {
    const uri = noteUris.current[note];
    if (!uri) return;
    player.replace({ uri });
    player.play();
    // Visual feedback
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    setPlayingNote(note);
    playTimerRef.current = setTimeout(() => setPlayingNote(null), 1000);
  }

  function stopScale() {
    scaleTimersRef.current.forEach(clearTimeout);
    scaleTimersRef.current = [];
    setPlayingScale(false);
    setPlayingNote(null);
  }

  function playScale() {
    if (playingScale) {
      stopScale();
      return;
    }
    if (!notesReady) return;
    setPlayingScale(true);
    const INTERVAL = 900; // ms between each note
    SOLFEGE_SCALE.forEach((item, i) => {
      const t = setTimeout(() => {
        playNote(item.note);
        if (i === SOLFEGE_SCALE.length - 1) {
          const done = setTimeout(() => setPlayingScale(false), 1000);
          scaleTimersRef.current.push(done);
        }
      }, i * INTERVAL);
      scaleTimersRef.current.push(t);
    });
  }

  // Quiz auto-advance
  useEffect(() => {
    if (selected === null) return;
    const t = setTimeout(() => {
      setSelected(null);
      setQuestion(generateQuestion(quizType));
    }, 1000);
    return () => clearTimeout(t);
  }, [selected, quizType]);

  function handleAnswer(answer: ScaleItem) {
    if (selected !== null) return;
    setSelected(answer.note);
    setScore((prev) => ({
      correct: prev.correct + (answer.note === question.correct.note ? 1 : 0),
      total: prev.total + 1,
      streak: answer.note === question.correct.note ? prev.streak + 1 : 0,
    }));
  }

  function changeQuizType(type: QuizType) {
    setQuizType(type);
    setSelected(null);
    setQuestion(generateQuestion(type));
  }

  function resetScore() {
    setScore({ correct: 0, total: 0, streak: 0 });
    setSelected(null);
    setQuestion(generateQuestion(quizType));
  }

  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.06)";
  const toggleBg = isLight ? "#E2DBCC" : COLOURS.primaryPurple;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
        isLandscape && styles.containerLandscape,
      ]}
    >
      {/* Header */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <Text
          style={[
            styles.title,
            { color: colors.title },
            isLandscape && styles.titleLandscape,
          ]}
        >
          Practice
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtitle }]}>
          Solfège training
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.tunerBtn,
          {
            borderColor: isLight ? "#B7B1A3" : COLOURS.lightPurple + "44",
            backgroundColor: isLight ? "#E2DBCC" : "rgba(255,255,255,0.06)",
          },
        ]}
        onPress={() => router.push("/tuner")}
        activeOpacity={0.8}
      >
        <Ionicons name="musical-notes" size={16} color={colors.title} />
        <Text style={[styles.tunerBtnText, { color: colors.title }]}>
          Open Tuner
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.subtitle} />
      </TouchableOpacity>

      {/* Mode Toggle */}
      <View style={[styles.modeToggle, { backgroundColor: toggleBg }]}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "reference" && styles.modeButtonActive,
          ]}
          onPress={() => setMode("reference")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: COLOURS.lightPurple },
              mode === "reference" && styles.modeButtonTextActive,
            ]}
          >
            Reference
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "quiz" && styles.modeButtonActive,
          ]}
          onPress={() => setMode("quiz")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeButtonText,
              { color: COLOURS.lightPurple },
              mode === "quiz" && styles.modeButtonTextActive,
            ]}
          >
            Quiz
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "reference" ? (
        /* ── REFERENCE MODE ── */
        <ScrollView
          contentContainerStyle={[
            styles.referenceContent,
            { paddingBottom: isLandscape ? 74 : 104 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.refHeader}>
            <Text style={[styles.sectionLabel, { color: colors.subtitle }]}>
              {notesReady ? "Tap a note to hear it" : "Loading tones…"}
            </Text>
            <TouchableOpacity
              style={[
                styles.playScaleBtn,
                {
                  borderColor: playingScale
                    ? COLOURS.brightYellow
                    : colors.border,
                },
                playingScale && { backgroundColor: "rgba(249,239,189,0.12)" },
              ]}
              onPress={playScale}
              disabled={!notesReady}
              activeOpacity={0.75}
            >
              <Ionicons
                name={playingScale ? "stop" : "play"}
                size={13}
                color={playingScale ? COLOURS.brightYellow : colors.subtitle}
              />
              <Text
                style={[
                  styles.playScaleTxt,
                  {
                    color: playingScale
                      ? COLOURS.brightYellow
                      : colors.subtitle,
                  },
                ]}
              >
                {playingScale ? "Stop" : "Play Scale"}
              </Text>
            </TouchableOpacity>
          </View>

          {SOLFEGE_SCALE.map((item, index) => {
            const isPlaying = playingNote === item.note;
            return (
              <TouchableOpacity
                key={item.syllable}
                style={[
                  styles.refCard,
                  { backgroundColor: cardBg },
                  isPlaying && {
                    backgroundColor: item.color + "22",
                    borderColor: item.color,
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() => playNote(item.note)}
                activeOpacity={0.75}
                disabled={!notesReady}
              >
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: item.color + "22",
                      borderColor: item.color + "55",
                    },
                  ]}
                >
                  <Text style={[styles.stepNum, { color: item.color }]}>
                    {index + 1}
                  </Text>
                </View>
                <View
                  style={[
                    styles.colorBar,
                    { backgroundColor: item.color },
                    isPlaying && { width: 6 },
                  ]}
                />
                <View style={styles.refCardBody}>
                  <Text style={[styles.refSyllable, { color: item.color }]}>
                    {item.syllable}
                  </Text>
                  <Text style={[styles.refNote, { color: colors.subtitle }]}>
                    Note — {item.note}
                  </Text>
                </View>
                <View style={styles.refRightCol}>
                  <Text
                    style={[
                      styles.refNoteLarge,
                      { color: item.color + (isPlaying ? "EE" : "99") },
                    ]}
                  >
                    {item.note}
                  </Text>
                  <Ionicons
                    name={isPlaying ? "volume-high" : "volume-medium-outline"}
                    size={14}
                    color={item.color + (isPlaying ? "DD" : "66")}
                    style={styles.speakerIcon}
                  />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Octave Do card */}
          {(() => {
            const base = SOLFEGE_SCALE[0];
            const isPlaying = playingNote === "C5";
            return (
              <TouchableOpacity
                style={[
                  styles.refCard,
                  styles.octaveCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: isPlaying ? base.color : base.color + "44",
                  },
                  isPlaying && { backgroundColor: base.color + "22" },
                ]}
                onPress={() => playNote("C5")}
                activeOpacity={0.75}
                disabled={!notesReady}
              >
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: base.color + "22",
                      borderColor: base.color + "55",
                    },
                  ]}
                >
                  <Text style={[styles.stepNum, { color: base.color }]}>8</Text>
                </View>
                <View
                  style={[
                    styles.colorBar,
                    { backgroundColor: base.color },
                    isPlaying && { width: 6 },
                  ]}
                />
                <View style={styles.refCardBody}>
                  <Text style={[styles.refSyllable, { color: base.color }]}>
                    Do
                  </Text>
                  <Text style={[styles.refNote, { color: colors.subtitle }]}>
                    Note — C (octave)
                  </Text>
                </View>
                <View style={styles.refRightCol}>
                  <Text
                    style={[
                      styles.refNoteLarge,
                      { color: base.color + (isPlaying ? "EE" : "99") },
                    ]}
                  >
                    C
                  </Text>
                  <Ionicons
                    name={isPlaying ? "volume-high" : "volume-medium-outline"}
                    size={14}
                    color={base.color + (isPlaying ? "DD" : "66")}
                    style={styles.speakerIcon}
                  />
                </View>
              </TouchableOpacity>
            );
          })()}
        </ScrollView>
      ) : (
        /* ── QUIZ MODE ── */
        <ScrollView
          contentContainerStyle={[
            styles.quizContent,
            { paddingBottom: isLandscape ? 74 : 104 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Quiz type toggle */}
          <View
            style={[
              styles.modeToggle,
              { backgroundColor: toggleBg, marginBottom: 14 },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.modeButton,
                quizType === "noteToSolfege" && styles.modeButtonActive,
              ]}
              onPress={() => changeQuizType("noteToSolfege")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: COLOURS.lightPurple },
                  quizType === "noteToSolfege" && styles.modeButtonTextActive,
                ]}
              >
                Note → Solfège
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                quizType === "solfegeToNote" && styles.modeButtonActive,
              ]}
              onPress={() => changeQuizType("solfegeToNote")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: COLOURS.lightPurple },
                  quizType === "solfegeToNote" && styles.modeButtonTextActive,
                ]}
              >
                Solfège → Note
              </Text>
            </TouchableOpacity>
          </View>

          {/* Score row */}
          <View style={styles.scoreRow}>
            <View
              style={[
                styles.scoreBadge,
                {
                  backgroundColor: isLight
                    ? "#E2DBCC"
                    : "rgba(255,255,255,0.07)",
                },
              ]}
            >
              <Text style={[styles.scoreLabel, { color: colors.subtitle }]}>
                Score
              </Text>
              <Text style={[styles.scoreValue, { color: colors.title }]}>
                {score.correct}/{score.total}
              </Text>
            </View>
            <View
              style={[
                styles.scoreBadge,
                {
                  backgroundColor: isLight
                    ? "#E2DBCC"
                    : "rgba(255,255,255,0.07)",
                },
              ]}
            >
              <Text style={[styles.scoreLabel, { color: colors.subtitle }]}>
                Streak
              </Text>
              <Text
                style={[
                  styles.scoreValue,
                  { color: score.streak >= 3 ? "#4CAF75" : colors.title },
                ]}
              >
                {score.streak}
                {score.streak >= 3 ? " 🔥" : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.border }]}
              onPress={resetScore}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetTxt, { color: colors.subtitle }]}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          {/* Question card */}
          <View style={styles.questionCard}>
            <Text style={styles.promptTxt}>{question.prompt}</Text>
            <View style={styles.questionRow}>
              <Text style={styles.questionTxt}>{question.questionText}</Text>
              <TouchableOpacity
                style={[
                  styles.quizSpeakerBtn,
                  playingNote === question.correct.note &&
                    styles.quizSpeakerBtnActive,
                ]}
                onPress={() => playNote(question.correct.note)}
                activeOpacity={0.7}
                disabled={!notesReady}
              >
                <Ionicons
                  name={
                    playingNote === question.correct.note
                      ? "volume-high"
                      : "volume-medium-outline"
                  }
                  size={22}
                  color={
                    playingNote === question.correct.note
                      ? COLOURS.brightYellow
                      : COLOURS.lightPurple
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Answer grid */}
          <View style={styles.answerGrid}>
            {question.answers.map((answer) => {
              const isCorrect = answer.note === question.correct.note;
              const isChosen = answer.note === selected;
              const isAnswered = selected !== null;
              return (
                <TouchableOpacity
                  key={answer.note}
                  style={[
                    styles.answerBtn,
                    {
                      borderColor: isLight
                        ? "#B7B1A3"
                        : COLOURS.lightPurple + "44",
                      backgroundColor: cardBg,
                    },
                    isAnswered && isCorrect && styles.answerCorrect,
                    isAnswered && isChosen && !isCorrect && styles.answerWrong,
                    isAnswered && !isCorrect && !isChosen && { opacity: 0.3 },
                  ]}
                  onPress={() => handleAnswer(answer)}
                  activeOpacity={0.75}
                  disabled={isAnswered}
                >
                  <Text
                    style={[
                      styles.answerTxt,
                      { color: colors.title },
                      isAnswered && isCorrect && { color: "#4CAF75" },
                      isAnswered &&
                        isChosen &&
                        !isCorrect && { color: "#E84B6E" },
                    ]}
                  >
                    {quizType === "noteToSolfege"
                      ? answer.syllable
                      : answer.note}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  containerLandscape: {
    paddingHorizontal: 18,
  },
  header: {
    marginTop: 12,
    marginBottom: 12,
  },
  headerLandscape: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  title: {
    fontSize: 48,
    fontFamily: "WinkyMilky",
    letterSpacing: 1,
  },
  titleLandscape: {
    fontSize: 34,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  tunerBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tunerBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },

  // Mode toggle (shared by reference/quiz type toggles)
  modeToggle: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: COLOURS.brightYellow,
  },
  modeButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  modeButtonTextActive: {
    color: COLOURS.darkBackground,
  },

  // Reference
  referenceContent: {
    paddingTop: 2,
  },
  refHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  playScaleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  playScaleTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  refRightCol: {
    alignItems: "center",
    gap: 2,
  },
  speakerIcon: {
    marginTop: 2,
  },
  refCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  octaveCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  colorBar: {
    width: 4,
    height: 30,
    borderRadius: 2,
  },
  refCardBody: {
    flex: 1,
  },
  refSyllable: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    lineHeight: 20,
  },
  refNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  refNoteLarge: {
    fontFamily: "WinkyMilky",
    fontSize: 26,
  },

  // Quiz
  quizContent: {
    paddingTop: 2,
  },
  scoreRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    alignItems: "stretch",
  },
  scoreBadge: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  scoreValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginTop: 2,
  },
  resetBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  resetTxt: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  questionCard: {
    backgroundColor: COLOURS.primaryPurple,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  promptTxt: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLOURS.lightPurple,
    marginBottom: 10,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  quizSpeakerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLOURS.lightPurple + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  quizSpeakerBtnActive: {
    borderColor: COLOURS.brightYellow,
    backgroundColor: "rgba(249,239,189,0.12)",
  },
  questionTxt: {
    fontFamily: "WinkyMilky",
    fontSize: 72,
    color: COLOURS.brightYellow,
    letterSpacing: 2,
  },
  answerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  answerBtn: {
    width: "47.5%",
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  answerCorrect: {
    borderColor: "#4CAF75",
    backgroundColor: "#4CAF7520",
  },
  answerWrong: {
    borderColor: "#E84B6E",
    backgroundColor: "#E84B6E20",
  },
  answerTxt: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
});
