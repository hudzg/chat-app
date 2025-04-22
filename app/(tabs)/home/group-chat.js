import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, TouchableOpacity, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/authContext";
import MessageList from "../../../components/MessageList";
import ChatRoomHeader from "../../../components/ChatRoomHeader";
import CustomKeyboardView from "../../../components/CustomKeyboardView";
import { sendGroupMessage, deleteGroup } from "../../../components/GroupActions";
import { Feather } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export default function GroupChat() {
  const item = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGroup, setIsGroup] = useState(true);
  const textRef = useRef("");
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const messageRef = collection(db, "groups", item.id, "messages");
    const q = query(messageRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(allMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [item.id]);

  const handleSendMessage = async () => {
    const message = textRef.current.trim();
    if (!message) return;

    try {
      await sendGroupMessage(item.id, {
        userId: user.userId,
        text: message,
        type: "text",
        createdAt: new Date(),
      });

      textRef.current = "";
      inputRef.current?.clear();
    } catch (error) {
      Alert.alert("Error", error.message);
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const handleAddMembers = () => {
    router.push({
      pathname: "/addMembers",
      params: {
        groupId: item.id,
        groupName: item.name,
      },
    });
  };

  const handleViewMembers = () => {
    router.push({
      pathname: "/viewMembers",
      params: {
        groupId: item.id,
        groupName: item.name,
      },
    });
  };

  const handleDeleteGroup = () => {
    Alert.alert("Delete group", "Are you sure you want to delete this group?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGroup(item.id);
            Alert.alert(
              "Success",
              "Group has been deleted successfully",
              [
                {
                  text: "OK",
                  onPress: () => router.back()
                }
              ]
            );
          } catch (error) {
            Alert.alert("Error", "Cannot delete group");
            console.error("Error deleting group:", error);
            throw error;
          }
        },
      },
    ]);
  };

  return (
    <CustomKeyboardView inChat={true}>
      <View className="flex-1 bg-white">
        <ChatRoomHeader
          router={router}
          groupName={item.name}
          isGroup={true}
          user={user}
          isAdmin={item.admin === user.userId}
          onAddMembers={handleAddMembers}
          onViewMembers={handleViewMembers}
          onDeleteGroup={handleDeleteGroup}
        />
        <View className="flex-1 bg-neutral-100">
          <MessageList
            scrollViewRef={scrollViewRef}
            currentUser={user}
            messages={messages}
            isGroup={isGroup}
          />
          <View className="p-2 bg-white">
            <View className="flex-row items-center space-x-2">
              <TextInput
                ref={inputRef}
                onChangeText={(value) => (textRef.current = value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-full px-4 py-2"
                style={{ fontSize: hp(2) }}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                className="bg-blue-500 p-2 rounded-full"
              >
                <Feather name="send" size={hp(2.5)} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </CustomKeyboardView>
  );
}
