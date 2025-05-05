import { View, Text, Alert } from "react-native";
import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthContextProvider, useAuth } from "../context/authContext";
import { MenuProvider } from "react-native-popup-menu";
import { CallProvider } from "../context/callContext";
import {
  getMessaging,
  getToken,
  onMessage,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { messaging } from "../rnFirebaseConfig";
import { PermissionsAndroid } from "react-native";
import { NativeModules } from "react-native";
// const activityStarter = NativeModules.ActivityStarter;
const { CallModule } = NativeModules;
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebaseConfig";

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
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

  const saveTokenToDatabase = async (token) => {
    try {
      if (user?.uid) {
        // First get the current user document
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Update existing document, add token to array if not exists
          await setDoc(
            userRef,
            {
              fcmTokens: arrayUnion(token),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } else {
          // Create new document with token array
          await setDoc(userRef, {
            fcmTokens: [token],
            updatedAt: new Date().toISOString(),
          });
        }
        console.log("Token saved to database successfully");
      }
    } catch (error) {
      console.error("Error saving token to database:", error);
    }
  };

  useEffect(() => {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    // const messaging = getMessaging();
    getToken(messaging, {
      vapidKey:
        "BPPFsSmbNspL5CmmmmjZPnLlA8iUawz6veujfJkLknukgQXzRMY2OEPc2fE__guXRZurHj8IE3napgHQkeLPEqg",
    })
      .then((currentToken) => {
        if (currentToken) {
          console.log("Token retrieved: ", currentToken);
          saveTokenToDatabase(currentToken);
        } else {
          // Show permission request UI
          console.log(
            "No registration token available. Request permission to generate one."
          );
          // ...
        }
      })
      .catch((err) => {
        console.log("An error occurred while retrieving token. ", err);
        // ...
      });
  }, [user]);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (remoteMessage) => {
      console.log("Message handled in the background!", remoteMessage);

      // Lấy dữ liệu từ thông báo
      const callerName = remoteMessage.data?.caller_name || "Unknown Caller";
      const callerNumber =
        remoteMessage.data?.caller_number || "Unknown Number";

      // Gọi Native Module để hiển thị IncomingCallActivity
      try {
        CallModule.showIncomingCall(callerName, callerNumber);
      } catch (error) {
        console.error("Error showing IncomingCallActivity:", error);
      }
    });

    setBackgroundMessageHandler(messaging, async (remoteMessage) => {
      console.log("A new FCM message arrived!", remoteMessage);

      const callerName = remoteMessage.data?.caller_name || "Unknown Caller";
      const callerNumber =
        remoteMessage.data?.caller_number || "Unknown Number";

      try {
        CallModule.showIncomingCall(callerName, callerNumber);
      } catch (error) {
        console.error("Error showing IncomingCallActivity:", error);
      }
    });

    return unsubscribe;
  }, []);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <MenuProvider>
      <AuthContextProvider>
        <CallProvider>
          <MainLayout />
        </CallProvider>
      </AuthContextProvider>
    </MenuProvider>
  );
}
