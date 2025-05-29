import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";

export default function OtherUsersProfile() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { userId, username, profileUrl, openByQRCode } = params;

  const handleSendFriendRequest = async () => {
    //console.log(friend);
    try {
      const friendRequestRef = collection(db, "friendRequests");
      const q = query(
        friendRequestRef,
        where("from", "==", user.userId),
        where("to", "==", userId)
      );

      // Kiểm tra xem đã có lời mời kết bạn chưa
      const friendRequestSnap = await getDocs(q);

      if (!friendRequestSnap.empty) {
        Alert.alert(
          "Success",
          `Friend request have already sent to ${username}`
        );
      } else {
        await setDoc(doc(db, "friendRequests", `${user.userId}_${userId}`), {
          from: user.userId,
          to: userId,
          status: "pending",
          createdAt: new Date(),
        });
        Alert.alert("Success", `Friend request sent to ${username}`);
      }
    } catch (error) {
      console.error("Error sending friend request:", error.message);
      Alert.alert("Error", "Failed to send friend request.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={hp(3)} color="gray" />
      </TouchableOpacity>

      <Image source={{ uri: profileUrl }} style={styles.profileImage} />
      <Text style={styles.username}>{username}</Text>
      {/* <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bio: </Text>
        <View>
          <Text>{user?.bio}</Text>
        </View>
      </View> */}

      <TouchableOpacity
        style={styles.addFriendButton}
        onPress={handleSendFriendRequest}
      >
        <Text style={styles.addFriendText}>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },
  closeButton: {
    position: "absolute",
    top: hp(5),
    left: wp(5),
    zIndex: 10,
    padding: 10,
    opacity: 0.5,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginTop: 120,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },
  addFriendButton: {
    backgroundColor: "mediumpurple",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 30,
  },
  addFriendText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});
