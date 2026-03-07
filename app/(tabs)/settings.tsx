import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import {
  AppOrientation,
  getOrientationPreference,
  setOrientationPreference,
} from "../../lib/preferences";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const applyOrientation = async (orientation: AppOrientation) => {
  if (orientation === "landscape") {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    return;
  }

  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
};

export default function Settings() {
  const { theme, setTheme } = useAppTheme();
  const [orientation, setOrientation] = useState<AppOrientation>("portrait");
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompactLandscape = isLandscape && height < 430;

  useEffect(() => {
    const loadPreferences = async () => {
      const savedOrientation = await getOrientationPreference();
      setOrientation(savedOrientation);
      await applyOrientation(savedOrientation);
    };

    void loadPreferences();
  }, []);

  const colors = useMemo(() => {
    if (theme === "light") {
      return {
        background: "#F8F7EF",
        card: "#FFFFFF",
        title: "#2A2A2A",
        body: "#5A5A5A",
        activeBg: "#2A2A2A",
        activeText: "#FFFFFF",
        inactiveBg: "#ECE8DC",
        inactiveText: "#2A2A2A",
      };
    }

    return {
      background: COLOURS.darkBackground,
      card: COLOURS.primaryPurple,
      title: COLOURS.brightYellow,
      body: COLOURS.lightPurple,
      activeBg: COLOURS.brightYellow,
      activeText: COLOURS.darkBackground,
      inactiveBg: "rgba(255,255,255,0.08)",
      inactiveText: COLOURS.lightPurple,
    };
  }, [theme]);

  const updateTheme = async (nextTheme: "dark" | "light") => {
    try {
      await setTheme(nextTheme);
    } catch {
      Alert.alert("Could not update theme", "Please try again.");
    }
  };

  const updateOrientation = async (nextOrientation: AppOrientation) => {
    try {
      setOrientation(nextOrientation);
      await applyOrientation(nextOrientation);
      await setOrientationPreference(nextOrientation);
    } catch {
      Alert.alert("Could not lock orientation", "Please try again.");
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        isLandscape && styles.containerLandscape,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, isLandscape && styles.titleLandscape, { color: colors.title }]}>Settings</Text>
      <Text style={[styles.subtitle, isLandscape && styles.subtitleLandscape, { color: colors.body }]}>Customize your experience</Text>

      <View style={[styles.sectionsWrap, isLandscape && styles.sectionsWrapLandscape]}>
      <View style={[styles.section, isLandscape && styles.sectionLandscape, { backgroundColor: colors.card }]}> 
        <Text style={[styles.sectionTitle, { color: colors.title }]}>Theme</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              isCompactLandscape && styles.optionButtonCompact,
              { backgroundColor: theme === "dark" ? colors.activeBg : colors.inactiveBg },
            ]}
            onPress={() => void updateTheme("dark")}
          >
            <Text
              style={[
                styles.optionText,
                { color: theme === "dark" ? colors.activeText : colors.inactiveText },
              ]}
            >
              Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              isCompactLandscape && styles.optionButtonCompact,
              { backgroundColor: theme === "light" ? colors.activeBg : colors.inactiveBg },
            ]}
            onPress={() => void updateTheme("light")}
          >
            <Text
              style={[
                styles.optionText,
                { color: theme === "light" ? colors.activeText : colors.inactiveText },
              ]}
            >
              Light
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, isLandscape && styles.sectionLandscape, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.title }]}>Orientation</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              isCompactLandscape && styles.optionButtonCompact,
              {
                backgroundColor:
                  orientation === "portrait" ? colors.activeBg : colors.inactiveBg,
              },
            ]}
            onPress={() => void updateOrientation("portrait")}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color:
                    orientation === "portrait" ? colors.activeText : colors.inactiveText,
                },
              ]}
            >
              Portrait
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              isCompactLandscape && styles.optionButtonCompact,
              {
                backgroundColor:
                  orientation === "landscape" ? colors.activeBg : colors.inactiveBg,
              },
            ]}
            onPress={() => void updateOrientation("landscape")}
          >
            <Text
              style={[
                styles.optionText,
                {
                  color:
                    orientation === "landscape" ? colors.activeText : colors.inactiveText,
                },
              ]}
            >
              Landscape
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  containerLandscape: {
    paddingHorizontal: 14,
  },
  title: {
    fontFamily: "WinkyMilky",
    fontSize: 38,
    marginTop: 8,
  },
  titleLandscape: {
    fontSize: 30,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 18,
  },
  subtitleLandscape: {
    marginBottom: 12,
  },
  sectionsWrap: {
    gap: 0,
  },
  sectionsWrapLandscape: {
    flexDirection: "row",
    gap: 12,
  },
  section: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  sectionLandscape: {
    flex: 1,
    marginBottom: 0,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
  },
  optionButtonCompact: {
    paddingVertical: 8,
  },
  optionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
