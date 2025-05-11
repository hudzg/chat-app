// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   Alert,
// } from "react-native";
// import { useAuth } from "../../context/authContext";
// import { usersRef, db } from "../../firebaseConfig";
// import { query, where, getDocs, doc, setDoc } from "firebase/firestore";
// import { connectStorageEmulator } from "firebase/storage";

// export default function SearchFriends() {
//   const { user } = useAuth();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [results, setResults] = useState([]);

//   const handleSearch = async () => {
//     if (!searchTerm.trim()) return;
//     try {
//       const q = query(
//         usersRef,
//         where("username", ">=", searchTerm),
//         where("username", "<=", searchTerm + "\uf8ff")
//       );
//       const querySnapshot = await getDocs(q);
//       const users = [];
//       querySnapshot.forEach((doc) => {
//         if (doc.data().userId !== user.userId) {
//           users.push(doc.data());
//         }
//       });
//       setResults(users);
//     } catch (error) {
//       console.error("Error searching users:", error.message);
//     }
//   };


//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Search Friends</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter username"
//         value={searchTerm}
//         onChangeText={setSearchTerm}
//         onSubmitEditing={handleSearch}
//       />
//       <FlatList
//         data={results}
//         keyExtractor={(item) => item.userId}
//         renderItem={({ item }) => (
//           <View style={styles.resultItem}>
//             <Image source={{ uri: item.profileUrl }} style={styles.avatar} />
//             <View style={{ flex: 1 }}>
//               <Text style={styles.username}>{item.username}</Text>
//             </View>
//             <TouchableOpacity
//               style={styles.addFriendButton}
//               onPress={() => handleSendFriendRequest(item)}
//             >
//               <Text style={styles.addFriendText}>Add Friend</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   input: {
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     marginBottom: 20,
//   },
//   resultItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#ccc",
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
//   },
//   username: {
//     fontSize: 18,
//   },
//   addFriendButton: {
//     backgroundColor: "#4CAF50",
//     paddingVertical: 5,
//     paddingHorizontal: 10,
//     borderRadius: 5,
//   },
//   addFriendText: {
//     color: "white",
//     fontWeight: "bold",
//   },
// });

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from "react-native"
import { StatusBar } from "react-native"

import { Ionicons } from "@expo/vector-icons"
import { getAllFriends, getAllOtherUser } from "../../utils/getUser"
import { useAuth } from "../../context/authContext"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import getAvatarUrl from "../../utils/getAvatarUrl"
import { query, where, getDocs, doc, setDoc } from "firebase/firestore";

// Mock data for friends
const initialFriends = [
  { id: "1", name: "Nguyen Van A", avatar: "https://randomuser.me/api/portraits/men/1.jpg", status: "online" },
  { id: "2", name: "Tran Thi B", avatar: "https://randomuser.me/api/portraits/women/2.jpg", status: "offline" },
  { id: "3", name: "Le Van C", avatar: "https://randomuser.me/api/portraits/men/3.jpg", status: "online" },
  { id: "4", name: "Pham Thi D", avatar: "https://randomuser.me/api/portraits/women/4.jpg", status: "offline" },
  { id: "5", name: "Hoang Van E", avatar: "https://randomuser.me/api/portraits/men/5.jpg", status: "online" },
  { id: "6", name: "Nguyen Thi F", avatar: "https://randomuser.me/api/portraits/women/6.jpg", status: "offline" },
  { id: "7", name: "Tran Van G", avatar: "https://randomuser.me/api/portraits/men/7.jpg", status: "online" },
  { id: "8", name: "Le Thi H", avatar: "https://randomuser.me/api/portraits/women/8.jpg", status: "offline" },
]



export default function FriendSearchScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState([])
  const [initialFriends, setInitialFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth();

  const handleSendFriendRequest = async (friend) => {
    //console.log(friend);
    try {
      const friendRequestRef = collection(db, "friendRequests");
      const q = query(
        friendRequestRef,
        where('from', '==', user.userId),
        where('to', '==', friend.id),
      );

      // Kiểm tra xem đã có lời mời kết bạn chưa
      const friendRequestSnap = await getDocs(q);

      if (!friendRequestSnap.empty) {
        Alert.alert("Success", `Friend request have already sent to ${friend.name}`);
        // Có thể thông báo cho người dùng hoặc return tại đây
        
      } else {
          await setDoc(doc(db, "friendRequests", `${user.userId}_${friend.id}`), {
            from: user.userId,
            to: friend.id,
            status: "pending",
            createdAt: new Date(),
          });
          Alert.alert("Success", `Friend request sent to ${friend.name}`);
      }
    } catch (error) {
      console.error("Error sending friend request:", error.message);
      Alert.alert("Error", "Failed to send friend request.");
    }
  };

  useEffect(() => {
    //console.log(1)
    const fetchData = async () => {
      const allOtherUsers = await getAllOtherUser(user.userId);
      //console.log(allOtherUsers);
      const adaptOtherUsers = allOtherUsers.map((otherUser) => ({
        id : otherUser.userId,
        name : otherUser.username,
        avatar: getAvatarUrl(otherUser.profileUrl),
        status: "Online",
      }));
      const allFriendIds = await getAllFriends(user.userId);
      const allUnfriends = adaptOtherUsers.filter(obj => !allFriendIds.includes(obj.id));
      setInitialFriends(allUnfriends);
    };
  
    fetchData();
  }, []);
  

  // Effect to filter friends based on search query
  useEffect(() => {
    setIsLoading(true)

    // Simulate API call delay
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === "") {
        setFriends(initialFriends)
      } else {
        const filteredFriends = initialFriends.filter((friend) =>
          friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        setFriends(filteredFriends)
      }
      setIsLoading(false)
    }, 30)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, initialFriends])

  // Render each friend item
  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem} >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <View style={styles.statusContainer}>
          <View
            style={[styles.statusIndicator, { backgroundColor: item.status === "Online" ? "#4CAF50" : "#9E9E9E" }]}
          />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.addButton} onPress = {() => {handleSendFriendRequest(item)}}>
        <Ionicons name="person-add-outline" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Friends</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {friends.length > 0 ? (
            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.friendsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Can not find this person</Text>
              <Text style={styles.emptySubText}>Try another name</Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white'
  },
  headerTitle: {
    paddingTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#333333",
  },
  clearButton: {
    padding: 4,
  },
  friendsList: {
    padding: 16,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#666666",
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
})

