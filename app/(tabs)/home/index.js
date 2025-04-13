import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { StatusBar } from "expo-status-bar";
// import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import ChatList from "../../components/ChatList";
import Loading from "../../components/Loading";
import { usersRef, db } from "../../firebaseConfig";
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
// import ChatList from "../../../components/ChatList";
// import Loading from "../../../components/Loading";
import { usersRef } from "../../../firebaseConfig";
import { getDocs, query, where } from "firebase/firestore";
import { printDatabase } from "../../../utils/printDB";

export default function Home() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   printDatabase("users");
  // }, []);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = listenToFriends();
      return () => unsubscribe();
    }
  }, [user?.uid]);

  const listenToFriends = () => {
    setLoading(true);

    const q1 = query(
      collection(db, "friends"),
      where("userId1", "==", user?.uid)
    );

    const q2 = query(
      collection(db, "friends"),
      where("userId2", "==", user?.uid)
    );

    const unsubscribe1 = onSnapshot(q1, (snapshot1) => {
      const friendIds1 = snapshot1.docs.map((doc) => doc.data().userId2);
      updateFriends(friendIds1, null);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
      const friendIds2 = snapshot2.docs.map((doc) => doc.data().userId1);
      updateFriends(null, friendIds2);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  };

  const updateFriends = (friendIds1, friendIds2) => {
    const friendIds = [
      ...new Set([...(friendIds1 || []), ...(friendIds2 || [])]),
    ];

    if (friendIds.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    fetchFriends(friendIds);
  };

  const fetchFriends = async (friendIds) => {
    try {
      const usersQuery = query(usersRef, where("userId", "in", friendIds));
      const usersSnapshot = await getDocs(usersQuery);

      let friends = [];
      usersSnapshot.forEach((doc) => {
        friends.push({ ...doc.data() });
      });

      setUsers(friends);
    } catch (e) {
      console.error("Error fetching friends:", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
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
