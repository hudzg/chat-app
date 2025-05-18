import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { RTCView } from "react-native-webrtc";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useRouter } from "expo-router";
import { useGroupCall } from "../../../context/groupCallContext";

export default function GroupCallScreen() {
  const router = useRouter();
  const {
    localStream,
    remoteStreams,
    isCalling,
    isInitiator,
    participants,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
  } = useGroupCall();

  // Calculate grid dimensions based on number of participants
  const totalParticipants = Object.keys(remoteStreams).length + 1; // +1 for local stream
  const columns = totalParticipants <= 2 ? 1 : 2;
  const streamWidth = columns === 1 ? wp(100) : wp(50);
  const streamHeight = totalParticipants <= 2 ? hp(50) : hp(33);

  useEffect(() => {
    console.log("GroupCallScreen mounted");
    console.log("incomingCall", incomingCall);
  }, []);

  if (incomingCall && !isCalling) {
    return (
      <View style={styles.incomingCallContainer}>
        <Text style={styles.incomingCallText}>
          Incoming group video call...
        </Text>
        <Text style={styles.participantsText}>
          {participants.length} participants in the call
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isCalling ? (
        <>
          <ScrollView contentContainerStyle={styles.streamsContainer}>
            {/* Local Stream */}
            {localStream && (
              <View
                style={[
                  styles.streamWrapper,
                  { width: streamWidth, height: streamHeight },
                ]}
              >
                <RTCView
                  streamURL={localStream.toURL()}
                  style={styles.streamView}
                />
                <Text style={styles.nameLabel}>
                  You + {localStream.toURL()}
                </Text>
              </View>
            )}

            {/* Remote Streams */}
            {Object.entries(remoteStreams).map(([participantId, stream]) => (
              <View
                key={participantId}
                style={[
                  styles.streamWrapper,
                  { width: streamWidth, height: streamHeight },
                ]}
              >
                <RTCView streamURL={stream.toURL()} style={styles.streamView} />
                <Text style={styles.nameLabel}>
                  {participants.find((p) => p.userId === participantId)?.name ||
                    "Participant" + stream.toURL()}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
              <Text style={styles.endCallText}>End Call</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Connecting to call...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#1a1a1a",
  },
  streamsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: hp(10), // Space for controls
  },
  streamWrapper: {
    padding: 5,
    position: "relative",
  },
  streamView: {
    flex: 1,
    // backgroundColor: "#2a2a2a",
    borderRadius: 10,
    // overflow: "hidden",
  },
  nameLabel: {
    position: "absolute",
    bottom: 15,
    left: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    borderRadius: 5,
    color: "white",
    fontSize: hp(1.8),
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(10),
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  endCallButton: {
    backgroundColor: "#ff3b30",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(8),
    borderRadius: 25,
  },
  endCallText: {
    color: "white",
    fontSize: hp(2),
    fontWeight: "bold",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  waitingText: {
    color: "white",
    fontSize: hp(2.5),
    fontWeight: "bold",
  },
});
