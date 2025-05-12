import React from 'react';
import { View, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Video } from 'expo-av';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from "expo-router";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

export default function MediaViewer() {
  const params = useLocalSearchParams();
  const { uri, type } = params;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={hp(3)} color="white" />
      </TouchableOpacity>

      {type === 'video' ? (
        <Video
          source={{ uri }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="contain"
          shouldPlay
          useNativeControls
          style={styles.media}
        />
      ) : (
        <Image
          source={{ uri }}
          style={styles.media}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: hp(5),
    left: wp(5),
    zIndex: 10,
    padding: 10,
    opacity: 0.5
  },
});