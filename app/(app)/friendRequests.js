import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useAuth } from "../../context/authContext";
import { db, usersRef } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";

export default function FriendRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const q = query(
          collection(db, "friendRequests"),
          where("to", "==", user.userId),
          where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);

        const requestsWithDetails = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const requestData = doc.data();
            const userDoc = await getDocs(
              query(usersRef, where("userId", "==", requestData.from))
            );
            const userData = userDoc.docs[0]?.data();
            return {
              id: doc.id,
              ...requestData,
              avatar: userData?.profileUrl || "",
              username: userData?.username || "Unknown",
            };
          })
        );

        setRequests(requestsWithDetails);
      } catch (error) {
        console.error("Error fetching friend requests:", error.message);
      }
    };

    fetchFriendRequests();
  }, []);

  const handleAcceptRequest = async (request) => {
    try {
      const requestRef = doc(db, "friendRequests", request.id);
      await updateDoc(requestRef, { status: "accepted" });

      const friendsRef = collection(db, "friends");
      await setDoc(doc(friendsRef), {
        userId1: user.userId,
        userId2: request.from,
        createdAt: new Date(),
      });

      Alert.alert("Success", `You are now friends with ${request.username}`);
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error("Error accepting friend request:", error.message);
      Alert.alert("Error", "Failed to accept friend request.");
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      const requestRef = doc(db, "friendRequests", request.id);
      await deleteDoc(requestRef);
      Alert.alert("Success", "Friend request rejected.");
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error("Error rejecting friend request:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friend Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <View style={styles.userInfo}>
              <Image source={{ uri: item.profileUrl }} style={styles.avatar} />
              <Text style={styles.username}>{item.username}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(item)}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(item)}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
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
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  acceptButton: {
    backgroundColor: "green",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: "red",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
