import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { StatusBar } from "expo-status-bar";
import HomeHeader from "../../../components/HomeHeader";
// import { heightPercentageToDP as hp } from "react-native-responsive-screen";
// import ChatList from "../../components/ChatList";
// import Loading from "../../components/Loading";
// import { usersRef, db } from "../../firebaseConfig";
import {
  onSnapshot,
  query,
  where,
  collection,
  getDocs,
} from "firebase/firestore";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import ChatList from "../../../components/ChatList";
import Loading from "../../../components/Loading";
import { usersRef, db } from "../../../firebaseConfig";
import { printDatabase } from "../../../utils/printDB";
import { getUser } from "../../../utils/getUser";
import { set } from "firebase/database";

export default function Home() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendIds1, setFriendIds1] = useState([]);
  const [friendIds2, setFriendIds2] = useState([]);

  // useEffect(() => {
  //   printDatabase("users");
  // }, []);

  useEffect(() => {
    if (user?.userId) {
      const unsubscribe = listenToFriends();
      return () => unsubscribe();
    }
  }, [user?.userId]);

  useEffect(() => {
    const allFriendIds = [...new Set([...friendIds1, ...friendIds2])];
    // console.log("Combined friend IDs:", allFriendIds);

    if(allFriendIds.length === 0) {
        setUsers([]);
        setLoading(false);  
        return;
    }
    fetchFriends(allFriendIds);
  }, [friendIds1, friendIds2]);

  const listenToFriends = () => {
    setLoading(true);

    const q1 = query(
      collection(db, "friends"),
      where("userId1", "==", user?.userId)
    );

    const q2 = query(
      collection(db, "friends"),
      where("userId2", "==", user?.userId)
    );

    const unsubscribe1 = onSnapshot(q1, (snapshot1) => {
      const ids = snapshot1.docs.map((doc) => doc.data().userId2);
      setFriendIds1(ids);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
      const ids = snapshot2.docs.map((doc) => doc.data().userId1);
      setFriendIds2(ids);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  };

  // const updateFriends = (friendIds1, friendIds2) => {
  //   const friendIds = [
  //     ...new Set([...(friendIds1 || []), ...(friendIds2 || [])]),
  //   ];
  //   console.log("this is friend id:", friendIds);
  //   if (friendIds.length === 0) {
  //     setUsers([]);
  //     setLoading(false);
  //     return;
  //   }

  //   fetchFriends(friendIds);
  // };

  const fetchFriends = async (friendIds) => {
    try {
      const friendPromises = friendIds.map((friendId) => getUser(friendId));
      const friends = await Promise.all(friendPromises);

      setUsers(friends);
    } catch (e) {
      console.error("Error fetching friends:", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <HomeHeader/>
      <StatusBar style="light" />
      {loading ? (
        <View className="flex items-center" style={{ top: hp(30) }}>
          <Loading size={hp(10)} />
        </View>
      ) : users.length > 0 ? (
        <ChatList currentUser={user} users={users} />
      ) : (
        <View className="flex items-center justify-center flex-1">
          <Text style={{ fontSize: 18, color: "#555" }}>
            You don't have any friends yet.
          </Text>
          <Text style={{ fontSize: 16, color: "#888", marginTop: 10 }}>
            Search for friends to start chatting!
          </Text>
        </View>
      )}
    </View>
  );
}