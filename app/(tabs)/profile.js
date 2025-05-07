import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";
import { router } from 'expo-router';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ref, onValue, set, remove, push, get } from "firebase/database";
import * as ImagePicker from "expo-image-picker";


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

      console.log(formData.get("file"));

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

      console.log("Upload response:", data);
      return data.secure_url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };
  
const ProfileScreen = () => {
  const { user } = useAuth(); // Lấy thông tin user từ context
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleEditAvatar = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const mediaUri = pickerResult.assets[0].uri;
      const mediaType = pickerResult.assets[0].type || "image";

      const downloadURL = await uploadMediaAsync(mediaUri, mediaType);
      
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        profileUrl: downloadURL
      })

      console.log(`Uploaded ${mediaType} and saved to Firestore!`);
    }
  } catch (error) {
    console.error("Error uploading media: ", error);
    Alert.alert("Error", "Failed to upload media");
  }
  };

  const handleEditBio = () => {
    // Xử lý logic chỉnh sửa giới thiệu
    console.log('Edit bio');
  };

  const handleSettings = () => {
    router.push('(tabs)/setting');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Icon name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user?.profileUrl }} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditAvatar}>
              <Icon name="camera-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.username}</Text>
            {/* <Text style={styles.username}>{user.username}</Text> */}
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{100}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{100}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{100}</Text>
              <Text style={styles.statLabel}>Đang theo dõi</Text>
            </View>
          </View>
        </View>
        
        {/* Bio Section */}
        <View style={styles.bioSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <TouchableOpacity onPress={handleEditBio} style={styles.editButton}>
            <Icon name="create-outline" size={24} color="black" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bioContent}>
            <Text style={styles.bioText}>{user?.bio}</Text>
          </View>
        </View>
        
        {/* Additional sections can be added here */}
        <View style={styles.additionalSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          </View>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Chưa có hoạt động nào gần đây</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    paddingTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  profileInfo: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'gray',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '80%',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
  },
  bioSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  bioContent: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  additionalSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ProfileScreen;