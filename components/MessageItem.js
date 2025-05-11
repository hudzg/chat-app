
import { View, Text, Image, TouchableOpacity, Linking, FlatList } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { router } from "expo-router";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Video } from "expo-av";

export default function MessageItem({
  message,
  currentUser,
  isGroup,
  onDeleteMessage,
}) {
  const [sender, setSender] = useState(null);
  const isOwner = currentUser?.userId === message?.userId;

  useEffect(() => {
    const fetchSenderInfo = async () => {
      if (isGroup && !isOwner) {
        try {
          const userDoc = await getDoc(doc(db, "users", message.userId));
          if (userDoc.exists()) setSender(userDoc.data());
        } catch (error) {
          console.error("Error fetching sender info:", error);
        }
      }
    };
    fetchSenderInfo();
  }, [message.userId]);

  const renderMessageContent = () => {
    if(message?.type === "deleted") {
      return <Text style={{ fontSize: hp(1.9), color: "#9CA3AF", fontStyle: "italic" }}>{message?.text}</Text>;

    }
    else if (message?.type === "location") {
      return (
        <View
          style={{  
            borderRadius: 12,
            maxWidth: wp(60),
          }}
        >
          <Text style={{ fontSize: hp(1.9) }}>
            {message?.text}
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/maps",
                params: {
                  latitude: message.latitude,
                  longitude: message.longitude,
                  viewOnly: "true",
                },
              })
            }
          >
            <MapView
              style={{
                width: wp(60),
                height: hp(15),
                marginTop: hp(1),
                borderRadius: 10,
              }}
              initialRegion={{
                latitude: message?.latitude,
                longitude: message?.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: message?.latitude,
                  longitude: message?.longitude,
                }}
              />
            </MapView>
          </TouchableOpacity>
        </View>
      );
    }
    else if (message?.type === "video") {
      return (
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
      );
    } else if (message?.type === "image") {
      return (
        <Image
          source={{ uri: message.mediaUrl }}
          style={{ width: wp(60), height: wp(60), borderRadius: 12 }}
          resizeMode="cover"
        />
      );
    }
    return <Text style={{ fontSize: hp(1.9) }}>{message?.text}</Text>;
  };

  return (
    <View className={`flex-row ${isOwner ? "justify-end mr-3" : "ml-3"} mb-3`}>
      {!isOwner && (
        <View className="mb-1">
          <Image
            source={{ uri: sender?.profileUrl }}
            style={{
              height: hp(4),
              width: hp(4),
              borderRadius: 100,
              marginRight: 5,
              marginTop: isGroup ? 24 : 0,
            }}
          />
        </View>
      )}
      <View style={{ width: wp(80) }}>
        {isGroup && !isOwner && sender && (
          <Text className="text-neutral-500 text-sm mb-1 ml-2">
            {sender.username}
          </Text>
        )}
        <View className={`${isOwner ? "self-end" : "self-start"}`}>
          <Menu>
            <MenuTrigger triggerOnLongPress>
              <View
                className={`p-3 px-4 rounded-2xl ${
                  isOwner
                    ? "bg-white border-neutral-200"
                    : "bg-indigo-100 border-indigo-200"
                } border`}
              >
                {renderMessageContent()}
              </View>
            </MenuTrigger>
            <MenuOptions
              optionsContainerStyle={{
                borderRadius: 12,
                marginTop: 30,
                width: 200,
                padding: 5,
              }}
            >
              {/* <MenuOption > */}
                {/* <View className="flex-row items-center gap-2 p-2">
                  <Ionicons
                    name="arrow-undo-outline"
                    size={hp(2.2)}
                    color="#737373"
                  />
                  <Text style={{ fontSize: hp(1.8) }}>Reply</Text>
                </View> */}
              {/* </MenuOption>
              <MenuOption >
                <View className="flex-row items-center gap-2 p-2">
                  <Ionicons
                    name="arrow-redo-outline"
                    size={hp(2.2)}
                    color="#737373"
                  />
                  <Text style={{ fontSize: hp(1.8) }}>Forward</Text>
                </View> */}
              {/* </MenuOption> */}
              <MenuOption onSelect={() => onDeleteMessage(message.id, false)}>
                <View className="flex-row items-center gap-2 p-2">
                  <Ionicons
                    name="trash-outline"
                    size={hp(2.2)}
                    color="#737373"
                  />
                  <Text style={{ fontSize: hp(1.8) }}>Delete for me</Text>
                </View>
              </MenuOption>
              {isOwner && (
                <MenuOption onSelect={() => onDeleteMessage(message.id, true)}>
                  <View className="flex-row items-center gap-2 p-2">
                    <Ionicons name="trash" size={hp(2.2)} color="#ff4444" />
                    <Text style={{ fontSize: hp(1.8), color: "#ff4444" }}>
                      Delete for everyone
                    </Text>
                  </View>
                </MenuOption>
              )}
            </MenuOptions>
          </Menu>
        </View>
      </View>
    </View>
  );
}
