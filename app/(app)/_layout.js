import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import HomeHeader from "../../components/HomeHeader";

export default function _layout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ header: () => <HomeHeader /> }} />
      <Stack.Screen name="chatRoom" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="searchFriends" />
      <Stack.Screen name="friendRequests" />
    </Stack>
  );
}
