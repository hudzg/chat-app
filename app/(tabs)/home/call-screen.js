import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RTCView } from "react-native-webrtc";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { useCall } from "../../../context/callContext";

export default function CallScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const {
    localStream,
    remoteStream,
    isCalling,
    isCaller,
    incomingCall,
    acceptCall,
    endCall,
    rejectCall,
  } = useCall();

  useEffect(() => {
    if (!isCalling && !incomingCall) {
      router.back();
    }
  }, [isCalling, incomingCall]);

  const switchCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack._switchCamera === "function") {
        videoTrack._switchCamera();
      }
    }
  };

  if (incomingCall && !isCaller) {
    return (
      <View style={styles.incomingCallContainer}>
        <Text style={styles.incomingCallText}>Có cuộc gọi video đến...</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
            <Text style={styles.buttonText}>Chấp nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
            <Text style={styles.buttonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <TouchableOpacity
        style={styles.switchCameraButton}
        onPress={switchCamera}
      >
        <Feather name="refresh-ccw" size={hp(3)} color="white" />
      </TouchableOpacity>

      <View style={styles.remoteContainer}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
          />
        ) : (
          <Text style={styles.waitingText}>Đang chờ kết nối...</Text>
        )}
      </View>
      <View style={styles.localContainer}>
        {localStream && (
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
        )}
      </View>
      <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
        <Text style={styles.endCallText}>Kết thúc cuộc gọi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
    width: "100%",
  },
  remoteContainer: {
    flex: 1,
    backgroundColor: "black",
    width: "100%",
    overflow: "hidden",
  },
  localContainer: {
    flex: 1,
    backgroundColor: "black",
    width: "100%",
    overflow: "hidden",
  },
  remoteVideo: {
    flex: 1,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  localVideo: {
    flex: 1,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  endCallButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: hp(3),
    backgroundColor: "red",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: 25,
    zIndex: 10,
  },
  videoContainer: {
    flex: 1,
  },
  endCallText: {
    color: "white",
    fontSize: hp(2),
    fontWeight: "bold",
  },
  incomingCallContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  incomingCallText: {
    fontSize: hp(3),
    fontWeight: "bold",
    marginBottom: hp(5),
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: wp(80),
  },
  acceptButton: {
    backgroundColor: "green",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: 25,
  },
  rejectButton: {
    backgroundColor: "red",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: 25,
  },
  buttonText: {
    color: "white",
    fontSize: hp(2),
    fontWeight: "bold",
  },
  waitingText: {
    color: "white",
    fontSize: hp(2.5),
    fontWeight: "bold",
  },
  switchCameraButton: {
    position: "absolute",
    top: hp(5),
    right: wp(5),
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: hp(1.5),
    borderRadius: 50,
    zIndex: 10,
  },
});
