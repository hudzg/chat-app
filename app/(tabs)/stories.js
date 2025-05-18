import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Alert
} from 'react-native';
import {router} from 'expo-router';
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 24) / COLUMN_COUNT;

const stories = [
  {
    id: 'add',
    type: 'add',
    image: 'https://images.unsplash.com/photo-1511885663737-eea53f6d6187?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    title: 'Add to story',
  },
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    user: 'Trần Vũ Đức Huy',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    count: 1,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    user: 'Lâm Nguyễn Hữu',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    count: 1,
    subtitle: 'Cùng thử vị phê',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    user: 'Hoàng Mạnh Duy',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    count: 2,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    user: 'User 4',
    avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
    count: 1,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    user: 'User 5',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    count: 1,
  },
];

const uploadMediaAsync = async (uri, mediaType) => {
  try {
    const formData = new FormData();
    const filename = uri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const type =
      mediaType === "video"
        ? "video/mp4"
        : match
        ? `image/${match[1]}`
        : "image";
    formData.append("file", {
      uri,
      name: filename,
      type,
    });
    formData.append(
      "upload_preset",
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );
    if (mediaType === "video") {
      formData.append("resource_type", "video");
    }
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/${mediaType}/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }
    return data.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

// Thêm hàm tính số giờ trước
function getTimeAgo(createdAt) {
  if (!createdAt) return '';
  const now = Date.now();
  const created = createdAt.seconds ? createdAt.seconds * 1000 : new Date(createdAt).getTime();
  const diffMs = now - created;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return 'Vừa xong';
  if (diffH === 1) return '1 giờ trước';
  return `${diffH} giờ trước`;
}

const StoriesScreen = () => {
  const { user } = useAuth();
  const [groupedStories, setGroupedStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy story từ Firestore và nhóm theo user
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'stories'), (snapshot) => {
      const now = Date.now();
      const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Lọc story trong 24h
      const validStories = stories.filter(story => {
        if (!story.createdAt) return false;
        const created = story.createdAt.seconds ? story.createdAt.seconds * 1000 : new Date(story.createdAt).getTime();
        return now - created < 24 * 60 * 60 * 1000;
      });
      // Nhóm story theo userId
      const grouped = {};
      validStories.forEach(story => {
        if (!grouped[story.userId]) {
          grouped[story.userId] = {
            userId: story.userId,
            username: story.username || 'Người dùng',
            avatar: story.avatar || 'https://cdn-icons-png.flaticon.com/512/9131/9131478.png',
            stories: [],
            latestMedia: story.mediaUrl,
            latestCreatedAt: story.createdAt,
          };
        }
        grouped[story.userId].stories.push(story);
        if (!grouped[story.userId].latestCreatedAt || (story.createdAt && story.createdAt > grouped[story.userId].latestCreatedAt)) {
          grouped[story.userId].latestMedia = story.mediaUrl;
          grouped[story.userId].latestCreatedAt = story.createdAt;
        }
      });
      const my = grouped[user?.userId] ? [grouped[user.userId]] : [];
      let others = Object.values(grouped).filter(g => g.userId !== user?.userId);
      // Sắp xếp others theo latestCreatedAt tăng dần (story mới nhất ở cuối)
      others = others.sort((a, b) => {
        const aTime = a.latestCreatedAt?.seconds ? a.latestCreatedAt.seconds : (a.latestCreatedAt ? new Date(a.latestCreatedAt).getTime()/1000 : 0);
        const bTime = b.latestCreatedAt?.seconds ? b.latestCreatedAt.seconds : (b.latestCreatedAt ? new Date(b.latestCreatedAt).getTime()/1000 : 0);
        return aTime - bTime;
      });
      setMyStories(my);
      setGroupedStories(others);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Logic thêm story
  const handleAddStory = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập thư viện ảnh!');
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });
      if (!pickerResult.canceled) {
        const mediaUri = pickerResult.assets[0].uri;
        const mediaType = pickerResult.assets[0].type || 'image';
        const downloadURL = await uploadMediaAsync(mediaUri, mediaType);
        // Lưu story vào Firestore
        const storyRef = collection(db, 'stories');
        await addDoc(storyRef, {
          userId: user.userId,
          username: user.username,
          avatar: user.profileUrl,
          mediaUrl: downloadURL,
          mediaType,
          createdAt: new Date(),
        });
        Alert.alert('Đăng story thành công!');
      }
    } catch (error) {
      console.error('Error uploading story: ', error);
      Alert.alert('Lỗi', 'Đăng story thất bại');
    }
  }, [user]);

  // Render item cho FlatList
  const renderItem = ({ item, index }) => {
    // Nếu là ô đầu tiên (của mình)
    if (index === 0) {
      if (myStories.length === 0) {
        // Chưa có story: Add to story
        return (
          <TouchableOpacity style={styles.storyItem} onPress={handleAddStory}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1511885663737-eea53f6d6187?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }} style={styles.storyImage} />
            <View style={styles.addIconContainer}>
              <Text style={styles.plusIcon}>+</Text>
            </View>
            <Text style={styles.addText}>Add to story</Text>
          </TouchableOpacity>
        );
      } else {
        // Đã có story: xem lại story của mình, có thể thêm mới
        const my = myStories[0];
        return (
          <TouchableOpacity style={styles.storyItem} onPress={() => router.push({ pathname: '(tabs)/viewStory', params: { userId: my.userId } })}>
            <Image source={{ uri: my.latestMedia }} style={styles.storyImage} />
            <View style={styles.avatarContainer}>
              <Image source={{ uri: my.avatar }} style={styles.avatar} />
            </View>
            <Text style={styles.username}>{my.username || 'Me'}</Text>
            {/* Hiển thị số giờ story mới nhất của mình */}
            <Text style={styles.storyTime}>{getTimeAgo(my.latestCreatedAt)}</Text>
            {/* Nút thêm mới story nhỏ */}
            <TouchableOpacity style={[styles.addIconContainer, { right: 8, left: undefined, top: 8 }]} onPress={handleAddStory}>
              <Text style={styles.plusIcon}>+</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }
    }
    // Các ô còn lại: story của người khác
    return (
      <TouchableOpacity style={styles.storyItem} onPress={() => router.push({ pathname: '(tabs)/viewStory', params: { userId: item.userId } })}>
        <Image source={{ uri: item.latestMedia }} style={styles.storyImage} />
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        </View>
        <Text style={styles.username}>{item.username}</Text>
        {/* Hiển thị số giờ story mới nhất của user này */}
        <Text style={styles.storyTime}>{getTimeAgo(item.latestCreatedAt)}</Text>
      </TouchableOpacity>
    );
  };

  // Data cho FlatList: ô đầu là của mình (hoặc add), sau đó là các user khác
  const flatListData = [myStories.length === 0 ? { type: 'add' } : myStories[0], ...groupedStories];

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Đang tải story...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
      </View>
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item, idx) => item.userId ? item.userId : 'add'}
        numColumns={2}
        contentContainerStyle={styles.storiesContainer}
      />
    </SafeAreaView>
  );
};

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
  },
  headerTitle: {
    paddingTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  storiesContainer: {
    padding: 4,
  },
  storyItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.5,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addIconContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    // transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    color: 'black',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: -3, // Điều chỉnh vị trí dấu cộng
  },
  addText: {
    position: 'absolute',
    bottom: 16,
    left: 10,
    right: 0,
    textAlign: 'left',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderWidth: 2,
    borderColor: '#1877f2',
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  countBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  username: {
    position: 'absolute',
    bottom: 16,
    left: 10,
    right: 0,
    textAlign: 'left',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  storyTime: {
    position: 'absolute',
    bottom: 36,
    left: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default StoriesScreen;