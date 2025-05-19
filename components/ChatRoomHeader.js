import { View, Text, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Entypo, Ionicons } from "@expo/vector-icons";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Image } from "expo-image";
import { blurhash } from "../utils/common";
import React from "react";

export default function ChatRoomHeader({
  user,
  router,
  startCall,
  isCaller,
  groupName,
  isGroup,
  onAddMembers,
  onViewMembers,
  onDeleteChat,
  onLeaveGroup,
  onQRCode,
  isAdmin,
}) {
  return (
    <Stack.Screen
      options={{
        title: "",
        headerShadowVisible: false,
        headerLeft: () => (
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              // style={{ borderWidth: 2, borderColor: "red" }}
              onPressIn={() => router.back()}
            >
              <Entypo name="chevron-left" size={hp(4)} color="mediumpurple" />
            </TouchableOpacity>
            <View className="flex-row items-center gap-3">
              <Image
                source={
                  isGroup
                    ? require("../assets/images/group-icon.png")
                    : user?.profileUrl
                }
                style={{ height: hp(4.5), aspectRatio: 1, borderRadius: 100 }}
                placeholder={{ blurhash }}
              />
              <Text
                style={{ fontSize: hp(2.5) }}
                className="text-neutral-700 font-medium"
              >
                {isGroup ? groupName : user?.username}
              </Text>
            </View>
          </View>
        ),
        headerRight: () => (
          <View className="flex-row items-center gap-8">
            <Ionicons name="call" size={hp(2.8)} color="mediumpurple" />
            <TouchableOpacity onPressIn={startCall}>
              <Ionicons name="videocam" size={hp(2.8)} color="mediumpurple" />
            </TouchableOpacity>

            <Menu>
              <MenuTrigger>
                <Ionicons
                  name="ellipsis-vertical"
                  size={hp(2.8)}
                  color="mediumpurple"
                />
              </MenuTrigger>
              <MenuOptions
                optionsContainerStyle={{
                  borderRadius: 12,
                  marginTop: 30,
                  width: 200,
                  padding: 5,
                }}
              >
                {isGroup && isAdmin && (
                  <View>
                    <MenuOption onSelect={onViewMembers}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons
                          name="people"
                          size={hp(2.2)}
                          color="#737373"
                        />
                        <Text style={{ fontSize: hp(1.8) }}>Members</Text>
                      </View>
                    </MenuOption>
                  </View>
                )}
                {isGroup && (
                  <View>
                    <MenuOption onSelect={onAddMembers}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons
                          name="person-add"
                          size={hp(2.2)}
                          color="#737373"
                        />
                        <Text style={{ fontSize: hp(1.8) }}>Add members</Text>
                      </View>
                    </MenuOption>
                    <MenuOption onSelect={onQRCode}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons
                          name="qr-code-outline"
                          size={hp(2.2)}
                          color="#737373"
                        />
                        <Text style={{ fontSize: hp(1.8) }}>QR Code</Text>
                      </View>
                    </MenuOption>
                    <MenuOption onSelect={onDeleteChat}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons
                          name="trash-outline"
                          size={hp(2.2)}
                          color="#ff4444"
                        />
                        <Text style={{ fontSize: hp(1.8), color: "#ff4444" }}>
                          Delete Chat
                        </Text>
                      </View>
                    </MenuOption>
                    <MenuOption onSelect={onLeaveGroup}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons
                          name="exit-outline"
                          size={hp(2.2)}
                          color="#ff4444"
                        />
                        <Text style={{ fontSize: hp(1.8), color: "#ff4444" }}>
                          Leave Group
                        </Text>
                      </View>
                    </MenuOption>
                  </View>
                )}
              </MenuOptions>
            </Menu>
          </View>
        ),
      }}
    />
  );
}
