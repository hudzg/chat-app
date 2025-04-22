import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { Stack, Slot, useRouter, useSegments } from "expo-router";
import { AuthContextProvider, useAuth } from "../context/authContext";
import { MenuProvider } from "react-native-popup-menu";

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (typeof isAuthenticated == "undefined") return;
    const inApp = segments[0] == "(tabs)";
    if (isAuthenticated && !inApp) {
      router.replace("home");
    } else if (isAuthenticated == false) {
      router.replace("signIn");
    }
  }, [isAuthenticated]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="viewMembers" 
        options={{ 
          title: "Members",
          headerShown: true,
          headerBackTitle: "Back",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="addMembers" 
        options={{ 
          title: "Add Members",
          headerShown: true,
          headerBackTitle: "Back",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="signIn" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="signUp" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <MenuProvider>
      <AuthContextProvider>
        <MainLayout />
      </AuthContextProvider>
    </MenuProvider>
  );
}