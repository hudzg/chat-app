import { Stack } from "expo-router";

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat-room"
        options={{
          headerShown: true, // Ẩn header
          presentation: "card", // Hoặc "modal" nếu muốn animation dạng modal
        }}
      />
      <Stack.Screen name="call-screen" options={{ headerShown: false }} />
      <Stack.Screen name="group-call-screen" options={{ headerShown: false }} />
    </Stack>
  );
}
