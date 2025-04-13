import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useAuth } from "../../context/authContext";
import { usersRef, db } from "../../firebaseConfig";
import { query, where, getDocs, doc, setDoc } from "firebase/firestore";

export default function SearchFriends() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const q = query(
        usersRef,
        where("username", ">=", searchTerm),
        where("username", "<=", searchTerm + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().userId !== user.userId) {
          users.push(doc.data());
        }
      });
      setResults(users);
    } catch (error) {
      console.error("Error searching users:", error.message);
    }
  };

  const handleSendFriendRequest = async (friend) => {
    try {
      const friendRequestRef = doc(
        db,
        "friendRequests",
        `${user.userId}_${friend.userId}`
      );
      await setDoc(friendRequestRef, {
        from: user.userId,
        to: friend.userId,
        status: "pending",
        createdAt: new Date(),
      });
      Alert.alert("Success", `Friend request sent to ${friend.username}`);
    } catch (error) {
      console.error("Error sending friend request:", error.message);
      Alert.alert("Error", "Failed to send friend request.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Friends</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        value={searchTerm}
        onChangeText={setSearchTerm}
        onSubmitEditing={handleSearch}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Image source={{ uri: item.profileUrl }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>{item.username}</Text>
            </View>
            <TouchableOpacity
              style={styles.addFriendButton}
              onPress={() => handleSendFriendRequest(item)}
            >
              <Text style={styles.addFriendText}>Add Friend</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  username: {
    fontSize: 18,
  },
  addFriendButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addFriendText: {
    color: "white",
    fontWeight: "bold",
  },
});
