import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/authContext";
import MessageList from "../../../components/MessageList";
import ChatRoomHeader from "../../../components/ChatRoomHeader";
import CustomKeyboardView from "../../../components/CustomKeyboardView";
import {
  sendGroupMessage,
  deleteGroup,
  deleteOneMessage,
} from "../../../components/GroupActions";
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

    const KeyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      updateScrollView
    );

    return () => {
      unsubscribe();
      KeyboardDidShowListener.remove();
    };
  }, []);

  const updateScrollView = () => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    updateScrollView();
  }, [messages]);

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
            Alert.alert("Success", "Group has been deleted successfully", [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]);
          } catch (error) {
            Alert.alert("Error", "Cannot delete group");
            console.error("Error deleting group:", error);
            throw error;
          }
        },
      },
    ]);
  };

  const handleDeleteOneMessage = async (
    messageId,
    deleteForEveryone = false
  ) => {
    Alert.alert(
      "Delete message",
      `Are you sure you want to delete this message${
        deleteForEveryone ? " for everyone" : ""
      }?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOneMessage(item.id, messageId, deleteForEveryone);
            } catch (error) {
              Alert.alert("Error", "Cannot delete message");
              throw error;
            }
          },
        },
      ]
    );
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
            onDeleteMessage={handleDeleteOneMessage}
          />

          <View className="pt-2 px-1" style={{ marginBottom: hp(1.7) }}>
            <View className="flex-row justify-between items-center mx-3">
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => handleSendMedia()}
                  className="bg-neutral-200 p-2 mr-2 rounded-full"
                >
                  <Feather name="image" size={hp(2.7)} color="#737373" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSendMedia()}
                  className="bg-neutral-200 p-2 mr-2 rounded-full"
                >
                  <Feather name="video" size={hp(2.7)} color="#737373" />
                </TouchableOpacity>
              </View>
              <View className="flex-1 flex-row justify-between bg-white border p-2 border-neutral-300 rounded-full pl-5">
                <TextInput
                  ref={inputRef}
                  onChangeText={(value) => (textRef.current = value)}
                  placeholder="Type message..."
                  style={{ fontSize: hp(2) }}
                  className="flex-1 mr-2"
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  className="bg-neutral-200 p-2 mr-[1px] rounded-full"
                >
                  <Feather name="send" size={hp(2.7)} color="#737373" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </CustomKeyboardView>
  );
}
