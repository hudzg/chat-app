import { View, Text, Button, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { StatusBar } from "expo-status-bar";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import ChatList from "../../components/ChatList";
import Loading from "../../components/Loading";
import { usersRef } from "../../firebaseConfig";
import { getDocs, query, where } from "firebase/firestore";

export default function Home() {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    console.log(user.uid);
    if (user?.uid) getUsers();
  }, []);

  const getUsers = async () => {
    // console.log("hung");
    try {
      const q = query(usersRef, where("userId", "!=", user?.uid));
      const querySnapshot = await getDocs(q);
      let data = [];
      querySnapshot.forEach((doc) => {
        data.push({ ...doc.data() });
      });
      // console.log("users", data);
      setUsers(data);
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      {users.length > 0 ? (
        <ChatList currentUser={user} users={users} />
      ) : (
        <View className="flex items-center" style={{ top: hp(30) }}>
          {/* <ActivityIndicator size="large" /> */}
          <Loading size={hp(10)} />
        </View>
      )}
    </View>
  );
}
