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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          height: isLandscape ? 58 : 70,
          paddingBottom: isLandscape ? 6 : 10,
          paddingTop: isLandscape ? 6 : 8,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          marginHorizontal: 0,
          marginBottom: 0,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: isLight ? "#AAA08C" : COLOURS.primaryPurple,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 20,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: isLandscape ? 10 : 11,
          fontWeight: "600",
          marginTop: isLandscape ? 1 : 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Identify",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="musical-notes" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="time-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="school-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tuner"
        options={{
          title: "Tuner",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="radio-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="settings-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconActive]}>
              <Ionicons name="bookmark-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    padding: 4,
    borderRadius: 10,
  },
  iconActive: {
    backgroundColor: "rgba(249, 239, 189, 0.15)", // yellow glow on active
  },
});
