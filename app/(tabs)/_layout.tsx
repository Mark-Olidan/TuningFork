// app/(tabs)/_layout.tsx
import { COLOURS } from "@/constants/Colours";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLOURS.primaryPurple,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          marginHorizontal: 0,
          marginBottom: 0,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: COLOURS.primaryPurple,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 20,
        },
        tabBarActiveTintColor: COLOURS.brightYellow, // yellow when active
        tabBarInactiveTintColor: COLOURS.lightPurple, // soft purple when inactive
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
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
