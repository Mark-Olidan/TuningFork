import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useAppTheme } from "@/context/themeContext";
import { COLOURS } from "@/constants/Colours";

export function LoadingScreen() {
  const { isLight, colors } = useAppTheme();

  const logo = isLight
    ? require("../assets/images/LogoLight.svg")
    : require("../assets/images/LogoDark.svg");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={logo} style={styles.logo} contentFit="contain" />
      <ActivityIndicator
        size="large"
        color={colors.title}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  spinner: {
    marginTop: 16,
  },
});
