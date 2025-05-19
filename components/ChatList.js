import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import ChatItem from "./ChatItem";
import { useRouter } from "expo-router";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ChatList({ currentUser, users }) {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const aiUser = {
    userId: 'chatgpt-bot',
    username: 'Trợ lý AI',
    profileUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png', // icon AI
    type: 'ai'
  };


  useEffect(() => {
    if (!currentUser?.userId) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", currentUser.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        type: 'group'
      }))
      .filter(group => {
        if (!group.deletedFor?.includes(currentUser.userId)) {
          return true;
        }

        const deletedAt = group.deletedAt?.[currentUser.userId];
        const lastMessageTime = group.lastMessage?.createdAt || 0;
        // console.log('deletedAt:', deletedAt, 'lastMessageTime:', lastMessageTime);

        if (!deletedAt) return true;

        return lastMessageTime > deletedAt;
      });
      setGroups(groupList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const allChats = [aiUser,...groups, ...users.map(user => ({ ...user, type: 'individual' }))];

  return (
    <View className="flex-1">
      <FlatList
        data={allChats}
        contentContainerStyle={{ paddingVertical: 25 }}
        keyExtractor={(item) => item.type + '_' + (item.id || item.userId)}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ChatItem
            noBorder={index + 1 === allChats.length}
            item={item}
            index={index}
            currentUser={currentUser}
          />
        )}
      />
    </View>
  );
}



// import { View, Text, FlatList } from "react-native";
// import React from "react";
// import ChatItem from "./ChatItem";
// import { useRouter } from "expo-router";

// export default function ChatList({ currentUser, users }) {
//   const router = useRouter();
//   return (
//     <View className="flex-1">
//       <FlatList
//         data={users}
//         contentContainerStyle={{ flex: 1, paddingVertical: 25 }}
//         keyExtractor={(item) => Math.random()}
//         showsVerticalScrollIndicator={false}
//         renderItem={({ item, index }) => (
//           <ChatItem
//             noBorder={index + 1 === users.length}
//             item={item}
//             index={index}
//             router={router}
//             currentUser={currentUser}
//           />
//         )}
//       />
//     </View>
//   );
// }
