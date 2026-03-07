import { COLOURS } from "@/constants/Colours";
import { AppTheme, getThemePreference, setThemePreference } from "@/lib/preferences";
import { Appearance } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeColors = {
  background: string;
  title: string;
  subtitle: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  border: string;
};

type ThemeContextValue = {
  theme: AppTheme;
  isLight: boolean;
  colors: ThemeColors;
  setTheme: (theme: AppTheme) => Promise<void>;
};

const darkColors: ThemeColors = {
  background: COLOURS.darkBackground,
  title: COLOURS.brightYellow,
  subtitle: COLOURS.lightPurple,
  tabBar: COLOURS.primaryPurple,
  tabActive: COLOURS.brightYellow,
  tabInactive: COLOURS.lightPurple,
  border: COLOURS.lightPurple,
};

const lightColors: ThemeColors = {
  background: "#F5F1E8",
  title: "#2A2B34",
  subtitle: "#666A81",
  tabBar: "#E2DBCC",
  tabActive: "#2A2B34",
  tabInactive: "#666A81",
  border: "#B7B1A3",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("dark");

  useEffect(() => {
    const load = async () => {
      const saved = await getThemePreference();
      setThemeState(saved);
      Appearance.setColorScheme(saved);
    };

    void load();
  }, []);

  const setTheme = async (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    Appearance.setColorScheme(nextTheme);
    await setThemePreference(nextTheme);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isLight: theme === "light",
      colors: theme === "light" ? lightColors : darkColors,
      setTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used inside ThemeProvider.");
  }
  return ctx;
}
