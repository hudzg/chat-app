import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { getUser } from "../../utils/getUser"
import { useAuth } from "../../context/authContext"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import getAvatarUrl from "../../utils/getAvatarUrl"
import { Feather } from "react-native-feather"
import {useRouter} from "expo-router"

export default function FriendScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const {user} = useAuth();
  const router = useRouter();

  const [contacts, setContacts] = useState([

  ]);

  useEffect(() => {
    //console.log (user.userId);
    const unsubcribe = onSnapshot(collection(db, "friends"), async (snapshot) => {
      //getContacts(snapshot);
      const friends1 = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(friend => friend.userId2 == user.userId).map(doc => doc.userId1);

      const friends2 = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(friend => friend.userId1 == user.userId).map(doc => doc.userId2);


      const friendIds = [...new Set([...friends1, ...friends2])];
      const friendPromises = friendIds.map((friendId) => getUser(friendId));
      const friends = await Promise.all(friendPromises);
      //console.log(friends)
      const contactList = friends
        .filter(friend => friend.username.toLowerCase().startsWith(searchQuery.toLowerCase()))
        .map(friend => ({
          id: friend.userId,
          name: friend.username,
          avatar: getAvatarUrl(friend.profileUrl)
        }));
      setContacts(contactList);
    })
    return () => unsubcribe();
  }, []);
  
  const handleAddFriend = () => {
    router.push("/searchFriends");
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <View style={styles.avatarContainer}>
          {item.isCustomAvatar ? (
            <View style={styles.customAvatar}>
              <Text style={styles.emojiAvatar}>🐸</Text>
            </View>
          ) : (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          )}
        </View>
        <Text style={styles.contactName}>{item.name}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={22} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <Feather name="bell" size={24} color="black" />
      </View>

      
      <View style={styles.searchContainer}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#D5D5D5" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#D5D5D5"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress = {handleAddFriend}>
          <View style={styles.addButtonContainer}>
            <Ionicons name="person" size={22} color="white" />
            <View style={styles.plusBadge}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButtonActive}>
          <Text style={styles.filterTextActive}>
            All <Text style={styles.boldText}>{contacts.length}</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButtonInactive}>
          <Text style={styles.filterTextInactive}>
            Active <Text style={styles.boldText}>1</Text>
          </Text>
        </TouchableOpacity>
      </View>


      {/* Contacts list */}
      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
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
  searchContainer : {
    backgroundColor: "mediumpurple",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: "black",
    marginLeft: 8,
    fontSize: 16,
  },
  addButton: {
    marginLeft: 12,
    padding: 4,
  },
  addButtonContainer: {
    position: "relative",
  },
  plusBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  plusText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#f5f5f5",
  },
  filterButtonActive: {
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterButtonInactive: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterTextActive: {
    color: "#333",
    fontSize: 14,
  },
  filterTextInactive: {
    color: "#666",
    fontSize: 14,
  },
  boldText: {
    fontWeight: "bold",
  },
  alphabetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  alphabetText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    marginRight: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  customAvatar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiAvatar: {
    fontSize: 24,
  },
  contactName: {
    fontSize: 16,
    color: "#333",
  },
  contactActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
})
