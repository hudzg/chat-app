import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../../context/authContext';
import MessageList from '../../../components/MessageList';
import ChatRoomHeader from '../../../components/ChatRoomHeader';
import CustomKeyboardView from '../../../components/CustomKeyboardView';
import { sendGroupMessage } from '../../../components/GroupActions';
import { Feather } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export default function GroupChat() {
  const item = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const textRef = useRef("");
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const messageRef = collection(db, "groups", item.id, "messages");
    const q = query(messageRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        profileUrl: user.profileUrl,
        senderName: user.username,
        type: 'text'
      });

      textRef.current = "";
      inputRef.current?.clear();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <CustomKeyboardView inChat={true}>
      <View className="flex-1 bg-white">
        <ChatRoomHeader router = {router} groupName={item.name} isGroup={true} user={user}/>
        <View className="flex-1 bg-neutral-100">
          <MessageList
            scrollViewRef={scrollViewRef}
            currentUser={user}
            messages={messages}
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