import { View, Text, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Image } from "expo-image";
import { blurhash, formatDate, getRoomId } from "../utils/common";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter } from 'expo-router';
import { get } from "firebase/database";

export default function ChatItem({ currentUser, item, noBorder }) {
  const [lastMessage, setLastMessage] = useState(undefined);
  const router = useRouter();

  const openChatRoom = () => {
    // router.push({ pathname: "/home/chat-room", params: item });
    if (item.type === 'group') {
      router.push({
        pathname: "/home/group-chat",
        params: item
      });
    } else {
      router.push({
        pathname: "/home/chat-room",
        params: item
      });
    }
  };

  useEffect(() => {
    if (!currentUser || !item) return;
    let unsubscribe = null;

    const setupListener = async () => {
      try {
        if (item.type === 'group') {
          const messageRef = collection(db, "groups", item.id, "messages");
          const q = query(messageRef, orderBy("createdAt", "desc"), limit(1));
          unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setLastMessage(messages[0]);
            } else {
              setLastMessage(null);
            }
          });
        } else {
          const roomId = getRoomId(currentUser?.userId, item?.userId);
          const docRef = doc(db, "rooms", roomId);
          const messageRef = collection(docRef, "messages");
          const q = query(messageRef, orderBy("createdAt", "desc"), limit(1));
          
          unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setLastMessage(messages[0]);
            } else {
              setLastMessage(null);
            }
          });
        }
      } catch (error) {
        console.error("Error setting up listener:", error);
        setLastMessage(null);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.userId, item]);

  // useEffect(() => {
  //   let roomId = getRoomId(currentUser?.userId, item?.userId);
  //   const docRef = doc(db, "rooms", roomId);
  //   const messageRef = collection(docRef, "messages");
  //   const q = query(messageRef, orderBy("createdAt", "desc"));
  //   let unsub = onSnapshot(q, (snapshot) => {
  //     let allMessages = snapshot.docs.map((doc) => {
  //       return doc.data();
  //     });
  //     setLastMessage(allMessages[0] ? allMessages[0] : null);
  //   });

  //   return unsub;
  // }, []);

  const renderTime = () => {
    if (lastMessage) {
      const date = lastMessage?.createdAt;
      return formatDate(new Date(date?.seconds * 1000));
    }
    return "Time";
  };

  const renderLastMessage = () => {
    if (typeof lastMessage === "undefined") return "Loading...";
    if (lastMessage) {
      if (currentUser?.userId === lastMessage?.userId)
        return "You: " + lastMessage?.text;
      return lastMessage?.text;
    } else {
      return "Say Hi";
    }
  };

  const getDisplayName = () => {
    if (item.type === 'group') {
      return item.name; // Tên group
    }
    return item.username; // Tên user trong chat 1-1
  };

  const getDisPlayImage = () => {
    if(item.type === 'group') {
      return require("../assets/images/group-icon.png"); 
    } else {
      return item?.profileUrl;
    }
  }

  return (
    <TouchableOpacity
      onPress={openChatRoom}
      className={`flex-row justify-between mx-4 items-center gap-3 mb-4 pb-2 ${
        noBorder ? "" : "border-b border-b-neutral-200"
      }`}
    >


      <Image
        style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
        source={getDisPlayImage()}
        placeholder={{ blurhash }}
        transition={500}
      />
      <View className="flex-1 gap-1">
        <View className="flex-row justify-between">
          <Text
            style={{ fontSize: hp(1.8) }}
            className="font-semibold text-neutral-800"
          >
            {getDisplayName()}
          </Text>
          <Text
            style={{ fontSize: hp(1.6) }}
            className="font-medium text-neutral-500"
          >
            {renderTime()}
          </Text>
        </View>
        <Text
          style={{ fontSize: hp(1.6) }}
          className="font-medium text-neutral-500"
        >
          {renderLastMessage()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
