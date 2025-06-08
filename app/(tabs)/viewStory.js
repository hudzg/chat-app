import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  Platform,
  PanResponder,
  Alert,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/authContext';

const { width, height } = Dimensions.get('window');

const StoryViewerScreen = () => {
  const { userId } = useLocalSearchParams();
  const [userStories, setUserStories] = useState([]); // stories của user được chọn
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const animation = useRef(null);
  const [userInfo, setUserInfo] = useState({});
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {}, // Không cần hiệu ứng
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 120) {
          closeStory();
        }
      },
    })
  ).current;
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Lấy stories của userId từ Firestore
    const unsubscribe = onSnapshot(collection(db, 'stories'), (snapshot) => {
      const allStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const now = Date.now();
      let filtered = allStories.filter(story => {
        if (!story.createdAt) return false;
        const created = story.createdAt.seconds ? story.createdAt.seconds * 1000 : new Date(story.createdAt).getTime();
        return now - created < 24 * 60 * 60 * 1000;
      });
      if (userId) {
        filtered = filtered.filter(story => story.userId === userId);
      }
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setUserStories(filtered);
      if (filtered.length > 0) {
        setUserInfo({
          avatar: filtered[0].avatar,
          username: filtered[0].username,
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    progressAnimation.setValue(0);
    startAnimation();
    return () => {
      if (animation.current) animation.current.stop();
    };
  }, [currentStoryIndex, userStories]);

  useEffect(() => {
    // Reset lại vị trí pan khi mở story mới
    pan.setValue({ x: 0, y: 0 });
  }, [userStories, currentStoryIndex]);

  useEffect(() => {
    setCurrentStoryIndex(0);
  }, [userStories, userId]);

  const startAnimation = () => {
    if (isPaused || !userStories.length) return;
    animation.current = Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    animation.current.start(({ finished }) => {
      if (finished) nextStory();
    });
  };

  const pauseAnimation = () => {
    if (animation.current) animation.current.stop();
  };

  const nextStory = () => {
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      closeStory();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handlePress = (evt) => {
    const x = evt.nativeEvent.locationX;
    if (x < width / 3) previousStory();
    else if (x > (width * 2) / 3) nextStory();
    else {
      setIsPaused(!isPaused);
      if (isPaused) startAnimation();
      else pauseAnimation();
    }
  };

  const closeStory = () => {
    pan.setValue({ x: 0, y: 0 });
    router.replace('(tabs)/stories');
  };

  const handleDeleteStory = async () => {
    try {
      await deleteDoc(doc(db, 'stories', userStories[currentStoryIndex].id));
      // Nếu còn story khác thì chuyển sang story tiếp theo, nếu không thì đóng
      if (currentStoryIndex < userStories.length - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
      } else if (currentStoryIndex > 0) {
        setCurrentStoryIndex(currentStoryIndex - 1);
      } else {
        closeStory();
      }
    } catch (e) {
      Alert.alert('Error', 'Can not delete story, please try again later.');
    }
  };

  const renderProgressBars = () => {
    const storiesCount = userStories.length;
    const progressBarWidth = (width - (storiesCount + 1) * 4) / storiesCount;
    return (
      <View style={styles.progressContainer}>
        {userStories.map((story, index) => (
          <View key={story.id} style={[styles.progressBar, { width: progressBarWidth }]}> 
            {index < currentStoryIndex ? (
              <View style={[styles.activeProgressBar, { width: '100%' }]} />
            ) : index === currentStoryIndex ? (
              <Animated.View
                style={[
                  styles.activeProgressBar,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            ) : (
              <View style={[styles.activeProgressBar, { width: '0%' }]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  // Thêm hàm tính số giờ trước
  function getTimeAgo(createdAt) {
    if (!createdAt) return '';
    const now = Date.now();
    const created = createdAt.seconds ? createdAt.seconds * 1000 : new Date(createdAt).getTime();
    const diffMs = now - created;
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffH < 1) return 'Now';
    if (diffH === 1) return '1 hour ago';
    return `${diffH} hours ago`;
  }

  const openMenu = () => setShowMenu(true);
  const closeMenu = () => setShowMenu(false);

  if (loading) {
    return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000'}}><Text style={{color:'#fff'}}>Loading stories...</Text></View>;
  }
  if (!userStories.length) {
    return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000'}}><Text style={{color:'#fff'}}>There is no story</Text></View>;
  }

  const currentStory = userStories[currentStoryIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.storyWrapper} {...panResponder.panHandlers}>
        <Image
          source={{ uri: currentStory.mediaUrl }}
          style={styles.storyImage}
          resizeMode="cover"
        />
        {/* Overlay header sát trên cùng */}
        <View style={styles.overlayHeader} pointerEvents="box-none">
          {renderProgressBars()}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
              <View style={styles.textContainer}>
                <Text style={styles.username}>{currentStory.username || userInfo.username || ''}</Text>
                <Text style={styles.storyTime}>{getTimeAgo(currentStory.createdAt)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {currentStory.userId === user?.userId && (
                <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
                  <Text style={styles.menuButtonText}>⋯</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={closeStory} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Footer với gửi tin nhắn */}
        <View style={styles.footer}>
          <View style={styles.replyContainerStrong}>
            <Text style={styles.replyTextStrong}>Send message</Text>
            <TouchableOpacity style={styles.sendButtonStrong}>
              <Text style={styles.sendButtonTextStrong}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Touchable toàn màn hình để điều hướng story */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.touchableArea}
          onPress={handlePress}
        />
        {/* Menu xóa story */}
        {showMenu && (
          <View style={styles.menuOverlay} pointerEvents="box-none">
            <TouchableOpacity style={styles.menuBackdrop} onPress={closeMenu} />
            <View style={styles.menuBox}>
              <TouchableOpacity onPress={() => { closeMenu(); handleDeleteStory(); }} style={styles.menuItem}>
                <Text style={styles.menuItemText}>Delete story</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeMenu} style={styles.menuItem}>
                <Text style={[styles.menuItemText, { color: '#888' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 10,
  },
  storyWrapper: {
    flex: 1,
    position: 'relative',
  },
  storyImage: {
    width,
    height,
    position: 'absolute',
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 10,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1877f2',
  },
  textContainer: {
    marginLeft: 10,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  storyTime: {
    color: '#eee',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  replyContainerStrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  replyTextStrong: {
    color: '#000',
    flex: 1,
    fontSize: 14,
  },
  sendButtonStrong: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1877f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonTextStrong: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 15,
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  activeProgressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
    position: 'absolute', // Quan trọng để di chuyển từ trái sang phải
    left: 0,
    top: 0,
  },
  touchableArea: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    marginBottom: 0,
  },
  menuItem: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    color: '#ff4444',
    fontWeight: 'bold',
  },
});

export default StoryViewerScreen;