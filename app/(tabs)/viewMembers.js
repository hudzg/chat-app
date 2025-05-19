import React, { useState, useEffect, } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
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
import { removeMembersFromGroup } from "../../components/GroupActions";
import { Ionicons } from "@expo/vector-icons";
import { 
  widthPercentageToDP as wp,heightPercentageToDP as hp } from "react-native-responsive-screen";
  import getAvatarUrl from "../../utils/getAvatarUrl";

export default function ViewMembers() {
  const { groupId, groupName } = useLocalSearchParams();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchMembers();
    }, [])
  );

  const fetchMembers = async () => {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      const memberIds = groupDoc
        .data()
        .members.filter((id) => id !== user.userId);

      if (memberIds.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("userId", "in", memberIds));
      const snapshot = await getDocs(q);

      setMembers(snapshot.docs.map((doc) => doc.data()));
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = (userId) => {
    setIsSelectionMode(true);
    setSelectedUsers([userId]);
  };

  const handlePress = (userId) => {
    if (isSelectionMode) {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const handleRemoveMembers = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Please select members to remove");
      return;
    }

    Alert.alert(
      "Remove Members",
      "Are you sure you want to remove selected members?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setSelectedUsers([]);
            setIsSelectionMode(false);
          },
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMembersFromGroup(groupId, selectedUsers);
              Alert.alert("Success", "Members removed successfully");
              setSelectedUsers([]);
              setIsSelectionMode(false);
              fetchMembers();
            } catch (error) {
              Alert.alert("Error", "Failed to remove members");
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white p-5">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="gray" />
        </View>
      ) : members.length === 0 ? (
        <Text className="text-gray-500 text-lg text-center">
          There is no members in this group
        </Text>
      ) : (
        <>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={hp(3)} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold mb-2.5 mt-5 text-center">Members</Text>
          <FlatList
            data={members}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center p-3 border-b border-gray-200"
                onPress={() => handlePress(item.userId)}
                onLongPress={() => handleLongPress(item.userId)}
                delayLongPress={500}
              >
                <Image
                  source={{ uri: getAvatarUrl(item.profileUrl) }}
                  style={{ width: hp(6), height: hp(6), borderRadius: hp(3) }}
                />
                <Text className="flex-1 ml-3 text-base">{item.username}</Text>
                {isSelectionMode && selectedUsers.includes(item.userId) && (
                  <Ionicons name="checkmark-circle" size={24} color="#ff4444" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.userId}
          />
          <Text className="text-gray-400 text-sm italic text-center mt-2 mb-4">
            Long press on a member to enter removal mode
          </Text>

          {isSelectionMode && (
            <View className="flex-row justify-between p-4">
              <TouchableOpacity
                className="bg-gray-500 p-4 rounded-lg flex-1 mr-2"
                onPress={() => {
                  setSelectedUsers([]);
                  setIsSelectionMode(false);
                }}
              >
                <Text className="text-white text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-red-500 p-4 rounded-lg flex-1 ml-2"
                onPress={handleRemoveMembers}
              >
                <Text className="text-white text-center font-semibold">
                  Remove ({selectedUsers.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: hp(4),
    left: wp(4),
    opacity: 0.5,
    backgroundColor: "white",
    padding: wp(2),
    borderRadius: 30,
    zIndex: 1,
  },
});