import messaging from "@react-native-firebase/messaging";

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log("Authorization status:", authStatus);
  }
}

export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.log("Error getting FCM token:", error);
    return null;
  }
}

export function setupMessaging(onMessageReceived) {
  return messaging().onMessage(async (remoteMessage) => {
    if (onMessageReceived) {
      onMessageReceived(remoteMessage);
    }
  });
}
