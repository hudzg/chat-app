import { StyleSheet, View, Text, Image, StatusBar } from "react-native";
import React from "react";
import { Tabs, Stack } from "expo-router";
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
  const isInMap = segments.includes("maps");
  const isMediaViewer = segments.includes("mediaViewer");
  const isCalling = segments.includes("call-screen");
  const isInGroupCall = segments.includes("group-call-screen");
  const isQrCodeScanner = segments.includes("qrCodeScanner");
  const isGroupProfile = segments.includes("groupProfile");
  const isOtherUsersProfile = segments.includes("otherUsersProfile");
  const isViewMembers = segments.includes("viewMembers");
  const isAddMembers = segments.includes("addMembers");
  const { top } = useSafeAreaInsets;
  const insets = useSafeAreaInsets();
  // console.log(isChatScreen);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          display: isChatScreen || isGroupChatScreen || isInMap || isMediaViewer || isCalling || isInGroupCall || isQrCodeScanner || isGroupProfile || isOtherUsersProfile || isViewMembers || isAddMembers ? "none" : "flex",
        },
        tabBarActiveTintColor: Colors[colorScheme ?? "dark"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          // header: () => {
          //   return isChatScreen ? null : <HomeHeader />; // Co the bo HomeHeader cho chat-room
          // },
          headerShown: false,
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
          headerShown: false,
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
          headerShown: false,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? "notifications-sharp" : "notifications-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      {/* <Tabs.Screen
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
      /> */}
      <Tabs.Screen
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
      />
      {/* ẩn khỏi thanh điều hướng bên dưới */}
      <Tabs.Screen
        name="searchFriends"
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
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="addMembers"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="viewMembers"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      
      <Tabs.Screen
        name="maps"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="mediaViewer"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="qrCodeScanner"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="otherUsersProfile"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="groupProfile"
        options={{
          href: null,
          headerShown: false,
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

      {/* <Tabs.Screen
        name="chat-room"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: 'none' }
        }}
      /> */}
    </Tabs>
    
  );
}

const styles = StyleSheet.create({
  headerStyle: {
    
  }
});