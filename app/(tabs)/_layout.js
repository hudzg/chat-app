import { StyleSheet, View, Text, Image} from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import HomeHeader from "../../components/HomeHeader";
import { useColorScheme } from "../../hooks/useColorScheme";  
import { Colors } from "../../constants/Colors"
import { Ionicons } from '@expo/vector-icons';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from "react-native-safe-area-context"; 

export default function _layout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const isChatScreen = segments.includes('chat-room');
  const {top} = useSafeAreaInsets

  console.log(isChatScreen)

  return (
    <Tabs screenOptions={
      {
        tabBarStyle: {
          display: isChatScreen ? 'none' : 'flex',

        },
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        
      }
    }>
      <Tabs.Screen
       name="home"
       options={{ 
        title: 'Home',
        header: () => {
          return isChatScreen ? <HomeHeader /> : <HomeHeader />; // Co the bo HomeHeader cho chat-room
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons name={focused ? 'home' : "home-outline"} color={color} size = {24}/>
        ),
       }} />
       <Tabs.Screen
        name="stories"
        options={{
          title: 'Story',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={{ alignItems: 'center' }}>
                <Image
                  source={
                    focused ? 
                    require('../../assets/images/stories-focused-icon.png') :
                    require('../../assets/images/stories-outline-icon.png')
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
          title: 'Friends',
          headerShown: true,
          tabBarIcon: ({ color, focused, size }) => (
              <View style={{ alignItems: 'center' }}>
                <Image
                  source={
                    focused ? 
                    require('../../assets/images/friends-focused-icon.png') :
                    require('../../assets/images/friends-outline-icon.png')
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
          title: 'Notification',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'notifications-sharp' : "notifications-outline"} color={color} size = {24}/>
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: 'Setting',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'settings' : "settings-outline"} color={color} size = {24}/>
          ),
        }}
      />
    </Tabs>
  );
}