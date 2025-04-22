import { View, Text, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Video } from "expo-av";

export default function MessageItem({ message, currentUser, isGroup }) {
  const [sender, setSender] = useState(null);

  useEffect(() => {
    const fetchSenderInfo = async () => {
      if (isGroup && message.userId !== currentUser?.userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", message.userId));
          if (userDoc.exists()) {
            setSender(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching sender info:", error);
        }
      }
    };

    fetchSenderInfo();
  }, [message.userId]);

  if (currentUser?.userId === message?.userId) {
    return (
      <View className="flex-row justify-end mb-3 mr-3">
        <View style={{ width: wp(80) }}>
          <View className="flex self-end p-3 rounded-2xl bg-white border border-neutral-200">
            {message?.type === "video" ? (
              <Video
                source={{ uri: message.mediaUrl }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="cover"
                shouldPlay={false}
                isLooping={false}
                style={{ width: wp(60), height: wp(60), borderRadius: 12 }}
                useNativeControls
              />
            ) : message?.type === "image" ? (
              <Image
                source={{ uri: message.mediaUrl }}
                style={{ width: wp(60), height: wp(60), borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: hp(1.9) }}>{message?.text}</Text>
            )}
          </View>
        </View>
      </View>
    );
  } else {
    return (
      <View style={{ width: wp(80) }} className="flex-row ml-3 mb-3">
        <View className="mb-1">
          <Image
            source={{ uri: sender?.profileUrl }}
            style={{
              height: hp(4),
              width: hp(4),
              borderRadius: 100,
              marginRight: 5,
              marginTop: isGroup ? 24 : 0
            }}
          />
        </View>
        <View>
          {isGroup && sender && (
            <Text className="text-neutral-500 text-sm mb-1 ml-2">
              {sender.username}
            </Text>
          )}
          <View className="flex self-start p-3 px-4 rounded-2xl bg-indigo-100 border border-indigo-200">
          {message?.type === "video" ? (
            <Video
              source={{ uri: message.mediaUrl }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              resizeMode="cover"
              shouldPlay={false}
              isLooping={false}
              style={{ width: wp(60), height: wp(60), borderRadius: 12 }}
              useNativeControls
            />
          ) : message?.type === "image" ? (
            <Image
              source={{ uri: message.mediaUrl }}
              style={{ width: wp(60), height: wp(60), borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: hp(1.9) }}>{message?.text}</Text>
          )}
        </View>
        </View>
      </View>
    );
  }
}
