import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "tuningfork_preferred_theme";
const ORIENTATION_KEY = "tuningfork_preferred_orientation";

export type AppTheme = "dark" | "light";
export type AppOrientation = "portrait" | "landscape";

export const getThemePreference = async (): Promise<AppTheme> => {
  const value = await AsyncStorage.getItem(THEME_KEY);
  return value === "light" ? "light" : "dark";
};

export const setThemePreference = async (theme: AppTheme): Promise<void> => {
  await AsyncStorage.setItem(THEME_KEY, theme);
};

export const getOrientationPreference = async (): Promise<AppOrientation> => {
  const value = await AsyncStorage.getItem(ORIENTATION_KEY);
  return value === "landscape" ? "landscape" : "portrait";
};

export const setOrientationPreference = async (
  orientation: AppOrientation,
): Promise<void> => {
  await AsyncStorage.setItem(ORIENTATION_KEY, orientation);
};
