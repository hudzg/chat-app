import { View, Text, TextInput, StyleSheet, Button } from "react-native";
import { Stack } from "expo-router"; // Để chỉnh tiêu đề trong expo-router
import React, { useEffect, useState } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { usersRef } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";

export default function SearchFriendsScreen() {

	const { logout, user } = useAuth();
	console.log(user);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const searchFriends = async (queryEmail) => {

			try {
				const q = query(usersRef,
					 where("email", "==", queryEmail)
					);
				const querySnapshot = await getDocs(q);
				let data = [];
				querySnapshot.forEach((doc) => {
					data.push({ ...doc.data() });
				});
				setFriends(data);
			} catch (e) {
				console.log(e.message);
			}
		};

  return (
    <View style={{ flex: 1, padding: 20 }}>

      <Text style={styles.title}>Thêm bạn bè</Text>

      <TextInput
      placeholder="Tìm kiếm bạn bè"
      value={searchQuery}
      onChangeText={setSearchQuery}
      onSubmitEditing={() => searchFriends(searchQuery)}
      style={styles.searchInput}
    	/>

		<View style={{ marginTop: 20 }}>
      {friends.length > 0 ? (
        friends.map((friend) => (
          <Text key={friend.userId}>{friend.username}</Text>
        ))
      ) : (
        <Text>Không có kết quả tìm kiếm</Text>
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
  },
});
