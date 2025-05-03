import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { Slot, useRouter, useSegments, usePathname } from "expo-router";
import { AuthContextProvider, useAuth } from "../context/authContext";
import { MenuProvider } from "react-native-popup-menu";
import { SafeAreaProvider } from 'react-native-safe-area-context';

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathName = usePathname();

  useEffect(() => {
    if (typeof isAuthenticated == "undefined") return;
    const   inApp = segments[0] == "(tabs)";
    if (isAuthenticated && !inApp) {
      router.replace('/(tabs)/home');
    } else if (isAuthenticated == false) {
      router.replace("signIn");
    }
  }, [isAuthenticated]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MenuProvider>
        <AuthContextProvider>
          <MainLayout />
        </AuthContextProvider>
      </MenuProvider>
    </SafeAreaProvider>
    
  );
}