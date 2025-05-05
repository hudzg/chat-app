import { StyleSheet, View, Text, Image, StatusBar } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import HomeHeader from "../../components/HomeHeader";
import { useColorScheme } from "../../hooks/useColorScheme";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useSegments } from "expo-router";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

export default function _layout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const isChatScreen = segments.includes("chat-room");
  const isGroupChatScreen = segments.includes("group-chat");
  const { top } = useSafeAreaInsets;
  const insets = useSafeAreaInsets();
  // console.log(isChatScreen);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          display: isChatScreen || isGroupChatScreen ? "none" : "flex",
        },
        tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          header: () => {
            return isChatScreen ? null : <HomeHeader />; // Co the bo HomeHeader cho chat-room
          },
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: "Stories",
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: "center" }}>
              <Image
                source={
                  focused
                    ? require("../../assets/images/stories-focused-icon.png")
                    : require("../../assets/images/stories-outline-icon.png")
                }
                style={{
                  height: 24,
                  width: 24,
                  tintColor: color,
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          headerShown: true,
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: "center" }}>
              <Image
                source={
                  focused
                    ? require("../../assets/images/friends-focused-icon.png")
                    : require("../../assets/images/friends-outline-icon.png")
                }
                style={{
                  height: 24,
                  width: 24,
                  tintColor: color,
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notification",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "notifications-sharp" : "notifications-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: "Setting",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      /> */}
      {/* ẩn khỏi thanh điều hướng bên dưới */}
      <Tabs.Screen
        name="searchFriends"
        options={{
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="friendRequests"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="createGroup"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="addMembers"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="viewMembers"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="viewStory"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: 'none' }
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    
  }
});