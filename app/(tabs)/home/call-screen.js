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
      {/* {remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} />
      ) : (
        <Text style={styles.waitingText}>Đang chờ kết nối...</Text>
      )}
      {localStream && (
        <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
      )}
      <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
        <Text style={styles.endCallText}>Kết thúc cuộc gọi</Text>
      </TouchableOpacity> */}
      {localStream && remoteStream ? (
        <>
          {/* Phần remoteStream */}
          <View style={styles.remoteStreamContainer}>
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.remoteVideo}
            />
          </View>

          {/* Phần localStream */}
          <View style={styles.localStreamContainer}>
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
            />
          </View>

          {/* Phần nút thoát cuộc gọi */}
          <View style={styles.endCallContainer}>
            <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
              <Text style={styles.endCallText}>Kết thúc cuộc gọi</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.waitingText}>Đang chờ kết nối...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    // backgroundColor: "black",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  remoteStreamContainer: {
    ...StyleSheet.absoluteFillObject, // Chiếm toàn bộ không gian
    zIndex: 1,
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
  },
  localStreamContainer: {
    position: "absolute",
    top: hp(2),
    right: wp(2),
    zIndex: 10,
  },
  localVideo: {
    width: wp(30),
    height: hp(20),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
    elevation: 10, // Cho Android
  },
  endCallContainer: {
    position: "absolute",
    bottom: hp(5),
    alignSelf: "center",
    zIndex: 20,
  },
  endCallButton: {
    // position: "absolute",
    // bottom: hp(5),
    // alignSelf: "center",
    backgroundColor: "red",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: 25,
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
});
