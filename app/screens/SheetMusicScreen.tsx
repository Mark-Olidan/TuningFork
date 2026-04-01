// app/screens/SheetMusicScreen.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE_URL = process.env.EXPO_PUBLIC_SHEET_MUSIC_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "loading" | "rendering" | "done" | "error";

const pickParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

// ── Sheet music HTML builder ──────────────────────────────────────────────────
function buildSheetMusicHtml(musicxml: string): string {
  const escaped = musicxml.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #ffffff; }
    #score { width: 100%; padding: 8px; }
  </style>
</head>
<body>
  <div id="score"></div>
  <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.5/build/opensheetmusicdisplay.min.js"></script>
  <script>
    (async () => {
      try {
        const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(
          document.getElementById('score'),
          { autoResize: true, backend: "svg", drawTitle: true, drawComposer: true }
        );
        await osmd.load(\`${escaped}\`);
        osmd.render();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'rendered',
          height: document.body.scrollHeight,
        }));
      } catch (err) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: err.message,
        }));
      }
    })();
  </script>
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SheetMusicScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{
    title?: string | string[];
    artist?: string | string[];
  }>();

  const title  = pickParam(params.title)  ?? "Unknown Song";
  const artist = pickParam(params.artist) ?? "Unknown Artist";

  const [status, setStatus]         = useState<Status>("loading");
  const [musicxml, setMusicxml]     = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string>("");
  const [webViewHeight, setWebViewHeight] = useState(800);

  // ── Fetch MusicXML from API ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchSheet() {
      try {
        const res = await fetch(`${API_BASE_URL}/sheet-music`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_name: title, artist }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? `Server error ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setMusicxml(data.musicxml);
          setStatus("rendering");
        }
      } catch (e: any) {
        if (!cancelled) {
          setErrorMsg(e.message ?? "Something went wrong.");
          setStatus("error");
        }
      }
    }

    void fetchSheet();
    return () => { cancelled = true; };
  }, [title, artist]);

  // ── WebView message handler ─────────────────────────────────────────────
  function handleWebViewMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "rendered") {
        setWebViewHeight(Math.max(msg.height, 400));
        setStatus("done");
      } else if (msg.type === "error") {
        setErrorMsg(msg.message);
        setStatus("error");
      }
    } catch {}
  }

  // ── Status label shown under the header ────────────────────────────────
  const statusLabel: Record<Status, string> = {
    loading:   "Fetching sheet music…",
    rendering: "Rendering score…",
    done:      "",
    error:     "",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.subtitle} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.title }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.artist, { color: colors.subtitle }]} numberOfLines={1}>{artist}</Text>
        </View>
      </View>

      {/* Loading / error states */}
      {(status === "loading" || status === "rendering") && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLOURS.lightPurple} />
          <Text style={[styles.statusText, { color: colors.subtitle }]}>
            {statusLabel[status]}
          </Text>
          {status === "loading" && (
            <Text style={[styles.hintText, { color: colors.subtitle }]}>
              This can take 30–90 seconds
            </Text>
          )}
        </View>
      )}

      {status === "error" && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Could not load sheet music</Text>
          <Text style={[styles.errorMsg, { color: colors.subtitle }]}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setStatus("loading");
            setMusicxml(null);
          }}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sheet music WebView — shown as soon as musicxml is ready */}
      {musicxml && (
        <WebView
          style={[
            styles.webView,
            // Keep mounted during "rendering" so OSMD can paint,
            // but hide the spinner overlay once done
            (status === "rendering") && styles.webViewHidden,
          ]}
          originWhitelist={["*"]}
          source={{ html: buildSheetMusicHtml(musicxml) }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled
        />
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  artist: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 12,
  },
  hintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    opacity: 0.6,
  },
  errorTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FF6B6B",
    marginTop: 8,
  },
  errorMsg: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: COLOURS.lightPurple,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: COLOURS.darkBackground,
  },
  webView: {
    flex: 1,
  },
  webViewHidden: {
    opacity: 0,
  },
});