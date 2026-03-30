// app/(tabs)/_layout.tsx
import { COLOURS } from "@/constants/Colours";
import { useAppTheme } from "@/context/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";

export default function TabLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { colors, isLight } = useAppTheme();
  const lightTabBarBg = "#D6CCB8";
  const lightTabBarBorder = "#B8AD96";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isLight ? lightTabBarBg : colors.tabBar,
          borderTopWidth: isLight ? 1 : 0,
          borderTopColor: isLight ? lightTabBarBorder : "transparent",
          height: isLandscape ? 62 : 76,
          paddingBottom: isLandscape ? 8 : 14,
          paddingTop: isLandscape ? 6 : 9,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          marginHorizontal: 0,
          marginBottom: 0,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: isLight ? "#908066" : COLOURS.primaryPurple,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isLight ? 0.26 : 0.4,
          shadowRadius: 10,
          elevation: 20,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: isLandscape ? 10 : 11,
          fontWeight: "600",
          marginTop: 0,
        },
      }}
    >
      {/* Home — no tab bar */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarStyle: { display: "none" },
          tabBarAccessibilityLabel: "Home tab",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="home-outline" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Identify */}
      <Tabs.Screen
        name="identify"
        options={{
          title: "Identify",
          tabBarAccessibilityLabel: "Identify tab",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="musical-notes" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Practice */}
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarAccessibilityLabel: "Practice tab",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="school-outline" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Combined Saved + History */}
      <Tabs.Screen
        name="saved"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Profile tab",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="bookmark-outline" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarAccessibilityLabel: "Settings tab",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="settings-outline" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Hidden screens — still routable but not in tab bar */}
      <Tabs.Screen name="results" options={{ href: null }} />
      <Tabs.Screen name="tuner" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    padding: 4,
    borderRadius: 10,
  },
  iconActive: {
    backgroundColor: "rgba(249, 239, 189, 0.15)",
  },
});
