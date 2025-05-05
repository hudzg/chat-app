import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";
import { addMembersToGroup } from "../../components/GroupActions";
import { Ionicons } from "@expo/vector-icons";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function AddMembers() {
  const { groupId, groupName } = useLocalSearchParams();
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchFriends();
      setSelectedUsers([]);
    }, [])
  );

  const fetchFriends = async () => {
    try {
      setLoading(true);
      // Fetch current group members first
      const groupRef = doc(db, "groups", groupId);
      const groupDoc = await getDoc(groupRef);
      if (!groupDoc.exists()) {
        console.error("Group not found");
        return;
      }
      const currentMembers = groupDoc.data().members || [];

      // Fetch friends
      const friendsRef = collection(db, "friends");
      const q1 = query(friendsRef, where("userId1", "==", user.userId));
      const q2 = query(friendsRef, where("userId2", "==", user.userId));

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const friendIds = [
        ...snap1.docs.map((doc) => doc.data().userId2),
        ...snap2.docs.map((doc) => doc.data().userId1),
      ];

      // Filter out friends who are already members
      const nonMemberFriendIds = Array.from(friendIds).filter(
        id => !currentMembers.includes(id)
      );

      if (nonMemberFriendIds.length > 0) {
        const usersRef = collection(db, "users");
        const userQuery = query(
          usersRef,
          where("userId", "in", nonMemberFriendIds)
        );
        const usersSnap = await getDocs(userQuery);
        setFriends(usersSnap.docs.map(doc => doc.data()));
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
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

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Please select users to add");
      return;
    }

    try {
      await addMembersToGroup(groupId, selectedUsers);
      Alert.alert("Success", "Members added successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to add members");
    }
  };

  return (
    <View className="flex-1 bg-white p-4">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="gray" />
        </View>
      ) : friends.length > 0 ? (
        <>
          <FlatList
            data={friends}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center p-3 border-b border-gray-200"
                onPress={() => toggleUserSelection(item.userId)}
              >
                <Image
                  source={{ uri: item.profileUrl }}
                  style={{ width: hp(6), height: hp(6), borderRadius: hp(3) }}
                />
                <Text className="flex-1 ml-3 text-base">{item.username}</Text>
                {selectedUsers.includes(item.userId) && (
                  <Ionicons name="checkmark-circle" size={24} color="#0084ff" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.userId}
          />
          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg mt-4"
            onPress={handleAddMembers}
          >
            <Text className="text-white text-center font-semibold">
              Add Selected Members
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">No friends available to add</Text>
        </View>
      )}
    </View>
  );
}
