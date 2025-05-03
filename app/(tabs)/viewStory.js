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
} from 'react-native';
import {router} from 'expo-router'

const { width, height } = Dimensions.get('window');

// Dữ liệu mẫu cho story
const DEMO_STORIES = [
  {
    id: '1',
    user: 'Trần Vũ Đức Huy',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    stories: [
      {
        id: '1-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        duration: 5000, // milliseconds
        seen: false,
        timestamp: '2 giờ trước',
      },
    ],
  },
  {
    id: '2',
    user: 'Lâm Nguyễn Hữu',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    stories: [
      {
        id: '2-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        duration: 5000,
        seen: false,
        timestamp: '5 giờ trước',
      },
      {
        id: '2-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        duration: 5000,
        seen: false,
        timestamp: '5 giờ trước',
      },
    ],
  },
  {
    id: '3',
    user: 'Hoàng Mạnh Duy',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    stories: [
      {
        id: '3-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        duration: 5000,
        seen: false,
        timestamp: '1 ngày trước',
      },
      {
        id: '3-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        duration: 5000,
        seen: false,
        timestamp: '1 ngày trước',
      },
    ],
  },
];

const StoryViewerScreen = ({ route, navigation }) => {
  // Trong thực tế, bạn sẽ nhận các tham số từ navigation
  // const { initialStoryIndex } = route.params || { initialStoryIndex: 0 };
  const initialStoryIndex = 0;

  const [currentUserIndex, setCurrentUserIndex] = useState(initialStoryIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const animation = useRef(null);

  const currentUser = DEMO_STORIES[currentUserIndex];
  const currentStory = currentUser.stories[currentStoryIndex];

  
  useEffect(() => {
    // Cấu hình status bar thay vì ẩn nó
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    return () => {
      // Khôi phục cài đặt mặc định khi rời khỏi màn hình
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#ffffff');
        StatusBar.setTranslucent(false);
      }
    };
  }, []);

  useEffect(() => {
    // Reset và bắt đầu animation mới khi story thay đổi
    progressAnimation.setValue(0);
    startAnimation();

    return () => {
      if (animation.current) {
        animation.current.stop();
      }
    };
  }, [currentUserIndex, currentStoryIndex]);

  const startAnimation = () => {
    if (isPaused) return;

    animation.current = Animated.timing(progressAnimation, {
      toValue: 1,
      duration: currentStory.duration,
      useNativeDriver: false,
    });

    animation.current.start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });
  };

  const pauseAnimation = () => {
    if (animation.current) {
      animation.current.stop();
    }
  };

  const nextStory = () => {
    // Nếu còn story của user hiện tại
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Chuyển sang user tiếp theo
      if (currentUserIndex < DEMO_STORIES.length - 1) {
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
      } else {
        // Đã xem hết tất cả story, quay lại màn hình trước
        closeStory();
      }
    }
  };

  const previousStory = () => {
    // Nếu không phải story đầu tiên của user hiện tại
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Quay lại user trước đó
      if (currentUserIndex > 0) {
        setCurrentUserIndex(currentUserIndex - 1);
        setCurrentStoryIndex(DEMO_STORIES[currentUserIndex - 1].stories.length - 1);
      }
    }
  };

  const handlePress = (evt) => {
    const x = evt.nativeEvent.locationX;
    
    // Nhấn vào 1/3 màn hình bên trái để quay lại
    if (x < width / 3) {
      previousStory();
    } 
    // Nhấn vào 1/3 màn hình bên phải để tiếp tục
    else if (x > (width * 2) / 3) {
      nextStory();
    } 
    // Nhấn vào giữa màn hình để tạm dừng/tiếp tục
    else {
      setIsPaused(!isPaused);
      if (isPaused) {
        startAnimation();
      } else {
        pauseAnimation();
      }
    }
  };

  const closeStory = () => {
    // Trong thực tế, bạn sẽ sử dụng navigation.goBack()
    router.replace('(tabs)/stories');
  };

  const renderProgressBars = () => {
    const storiesCount = currentUser.stories.length;
    const progressBarWidth = (width - (storiesCount + 1) * 4) / storiesCount;
    
    return (
      <View style={styles.progressContainer}>
        {currentUser.stories.map((story, index) => {
          return (
            <View key={story.id} style={[styles.progressBar, { width: progressBarWidth }]}>
              {index < currentStoryIndex ? (
                // Các story đã xem - hiển thị đầy đủ
                <View style={[styles.activeProgressBar, { width: '100%' }]} />
              ) : index === currentStoryIndex ? (
                // Story hiện tại - hiển thị animation
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
                // Các story chưa xem - hiển thị trống
                <View style={[styles.activeProgressBar, { width: '0%' }]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <TouchableOpacity
        activeOpacity={1}
        style={styles.container}
        onPress={handlePress}
      >
        <Image
          source={{ uri: currentStory.url }}
          style={styles.storyImage}
          resizeMode="cover"
        />
        
        <View style={styles.overlay}>
          {/* Thanh tiến trình */}
          
          
          {/* Header với thông tin người dùng */}
          <View>
              {renderProgressBars()}
              <View style={styles.header}>
              <View style={styles.userInfo}>
                <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
                <View style={styles.textContainer}>
                  <Text style={styles.username}>{currentUser.user}</Text>
                  <Text style={styles.timestamp}>{currentStory.timestamp}</Text>
                </View>
              </View>
              
              <TouchableOpacity onPress={closeStory} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
          </View>
          </View>
          
          {/* Footer với các tùy chọn tương tác */}
          <View style={styles.footer}>
            <View style={styles.replyContainer}>
              <Text style={styles.replyText}>Gửi tin nhắn</Text>
              <TouchableOpacity style={styles.sendButton}>
                <Text style={styles.sendButtonText}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 10,
  },
  storyImage: {
    width,
    height,
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between'
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
  header: {
    flexDirection: 'row',
    alignItems: 'start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,

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
  timestamp: {
    color: '#eee',
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyText: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1877f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StoryViewerScreen;