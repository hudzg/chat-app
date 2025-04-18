import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import ChatItem from "./ChatItem";
import { useRouter } from "expo-router";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ChatList({ currentUser, users }) {
  const router = useRouter();
  const [groups, setGroups] = useState([]);

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
      }));
      setGroups(groupList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const allChats = [...groups, ...users.map(user => ({ ...user, type: 'individual' }))];

  return (
    <View className="flex-1">
      <FlatList
        data={allChats}
        contentContainerStyle={{ flex: 1, paddingVertical: 25 }}
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
