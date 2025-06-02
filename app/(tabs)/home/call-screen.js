import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { RTCView } from "react-native-webrtc";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { useCall } from "../../../context/callContext";
import { Feather, MaterialIcons } from "@expo/vector-icons";


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
        <Text style={styles.incomingCallText}>Incomming video call...</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
            <Text style={styles.buttonText}>Reject </Text>
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
          <Text style={styles.waitingText}>Connecting...</Text>
        )}
      </View>
      <View style={styles.localContainer}>
        {localStream && (
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
        )}
      </View>
      <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
        <MaterialIcons name="call-end" size={hp(3)} color="white" />
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
  remoteStreamContainer: {
    ...StyleSheet.absoluteFillObject, // Chiếm toàn bộ không gian
    zIndex: 1,
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
  endCallContainer: {
    position: "absolute",
    alignSelf: "center",
    bottom: hp(3),
    backgroundColor: "red",
    padding: hp(2),
    borderRadius: 50,
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
    textAlign: "center",
    marginTop: hp(25),
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
  endCallButton: {
    position: 'absolute',
    bottom: hp(5),  
    alignSelf: 'center',
    backgroundColor: 'red',
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
});
