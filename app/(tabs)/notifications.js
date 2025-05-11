import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
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
import { StatusBar } from 'expo-status-bar';
import {printDatabase} from '../../utils/printDB'

/**
 * Notification Schema: 
 * (id, type, user, content, createdAt, status)
 */

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);

  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  
  const adaptRequestToNotification = async (request) => {
    const q = query(collection(db, "users"), where("userId", "==", request.from));
    const querySnapshot = await getDocs(q);
    const sentUser = querySnapshot.docs.map((doc) => ({
      ...doc.data()
    }))[0];
    console.log(sentUser);
    return {
      id : request.id,
      type : "Friend Request",
      user: sentUser,
      content: "sent you a friend request",
      createAt: request.createAt,
      status: request.status,
      request: request
    };
  };


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
        setNotifications(await Promise.all(requests.map(request=>adaptRequestToNotification(request))));
        
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


  // const handleAcceptFriend = (request) => {
  //   // Xử lý chấp nhận lời mời kết bạn
  //   setNotifications(notifications.map(notification => 
  //     notification.id === id ? { ...notification, read: true } : notification
  //   ));
  // };

  // const handleDeclineFriend = (id) => {
  //   // Xử lý từ chối lời mời kết bạn
  //   setNotifications(notifications.map(notification => 
  //     notification.id === id ? { ...notification, read: true } : notification
  //   ));
  // };

  const handleNotificationClick = (notification) => {
    // Đánh dấu thông báo đã đọc khi click
    setNotifications(notifications.map(item => 
      item.id === notification.id ? { ...item, read: true } : item
    ));

    // Điều hướng đến màn hình tương ứng
    if (notification.type === 'message') {
      navigation.navigate('Messages', { userId: notification.user.id });
    } else if (notification.type === 'call') {
      navigation.navigate('Calls', { userId: notification.user.id });
    } else if (notification.type === 'friend-request') {
      navigation.navigate('Friends', { userId: notification.user.id });
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationClick(item)}
    >
      <Image 
        source={{ uri: item.user.profileUrcl  }} 
        style={styles.avatar} 
      />
      
      <View style={styles.contentContainer}>
        <View style={styles.textContent}>
          <Text style={styles.userName}>{item.user.username}</Text>
          <Text style={styles.notificationText}>{item.content}</Text>
        </View>
        
        <Text style={styles.timeText}>{item.time}</Text>
        
        {item.type === 'Friend Request' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={async () => await handleAcceptRequest(item.request)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.declineButton}
              onPress={async () => await handleRejectRequest(item.request)}
            >
              <Text style={styles.declineButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Feather name="bell" size={24} color="black" />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    paddingTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f5f7fa',
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    marginTop: 5
  },
  contentContainer: {
    flex: 1,
    marginLeft: 5,
  },
  textContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userName: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  notificationText: {
    flex: 1,
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    //marginTop: 10,
  },
  acceptButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  declineButtonText: {
    color: '#333',
  },
});