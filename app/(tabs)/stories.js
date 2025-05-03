import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions
} from 'react-native';
import {router} from 'expo-router';
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

const handleAddPress = () => {
  console.log('TouchableOpacity pressed!');
  alert('Button pressed!');
};

const handleViewStoryPress = () => {
  router.push('(tabs)/viewStory');
};

const StoryItem = ({ item }) => {
  if (item.type === 'add') {
    return (
      <TouchableOpacity style={styles.storyItem} onPress={handleAddPress}>
        <Image source={{ uri: item.image }} style={styles.storyImage} />
        <View style={styles.addIconContainer}>
          <Text style={styles.plusIcon}>+</Text>
        </View>
        <Text style={styles.addText}>{item.title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.storyItem} onPress={handleViewStoryPress}>
      <Image source={{ uri: item.image }} style={styles.storyImage} />
      {item.avatar && (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          {/* {item.count > 0 && <View style={styles.countBadge}><Text style={styles.countText}>{item.count}</Text></View>} */}
        </View>
      )}
      {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
      <Text style={styles.username}>{item.user}</Text>
    </TouchableOpacity>

  );
};

const StoriesScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
      </View>
      <FlatList
        data={stories}
        renderItem={({ item }) => <StoryItem item={item} />}
        keyExtractor={item => item.id}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    paddingTop: 10,
    fontSize: 32,
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
});

export default StoriesScreen;