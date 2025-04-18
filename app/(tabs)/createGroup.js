import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/authContext";
import { createGroup } from "../../components/GroupActions";
import { useRouter } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.userId) {
      router.replace("/signIn");
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const friendsRef = collection(db, "friends");
      const q1 = query(friendsRef, where("userId1", "==", user.userId));
      const q2 = query(friendsRef, where("userId2", "==", user.userId));

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      const friendIds = [
        ...snapshot1.docs.map((doc) => doc.data().userId2),
        ...snapshot2.docs.map((doc) => doc.data().userId1),
      ].filter(Boolean);

      if (friendIds.length > 0) {
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("userId", "in", friendIds));
        const usersSnapshot = await getDocs(userQuery);

        const friendsList = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            userId: data.userId,
            username: data.username || "Unnamed User",
            profileUrl: data.profileUrl,
          };
        });
        setUsers(friendsList);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      const groupData = {
        name: groupName.trim(),
        admin: user.userId,
        members: [...selectedUsers, user.userId],
        type: "group",
        profileUrl: null,
        createdAt: new Date(),
        lastMessage: null,
      };

      await createGroup(groupData);
      router.back();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUsers.includes(item.userId) && styles.selectedUser,
      ]}
      onPress={() => toggleUserSelection(item.userId)}
    >
      <View style={styles.userItemContent}>
        <Image
          source={{ uri: item.profileUrl }}
          style={styles.userAvatar}
          placeholder={null}
          transition={200}
        />
        <Text style={styles.username}>{item.username}</Text>
      </View>
      {selectedUsers.includes(item.userId) && (
        <Ionicons name="checkmark-circle" size={20} color="#0084ff" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Group name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <Text style={styles.subtitle}>Select members</Text>
      {users.length === 0 ? (
        <Text style={styles.noFriends}>You have no friends</Text>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity
        style={[
          styles.button,
          (!groupName.trim() || selectedUsers.length === 0) &&
            styles.buttonDisabled,
        ]}
        onPress={handleCreateGroup}
        disabled={!groupName.trim() || selectedUsers.length === 0}
      >
        <Text style={styles.buttonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: hp(2),
  },
  subtitle: {
    fontSize: hp(2),
    fontWeight: "bold",
    marginBottom: 10,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  selectedUser: {
    backgroundColor: "#e3efff",
  },
  userAvatar: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
  },
  username: {
    fontSize: hp(2),
    color: "#333",
  },
  noFriends: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: hp(2),
  },
  button: {
    backgroundColor: "#0084ff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: hp(2),
    fontWeight: "bold",
  },
});
