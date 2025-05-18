import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
// import { StatusBar } from "expo-status-bar";
import ChatRoomHeader from "../../../components/ChatRoomHeader";
import MessageList from "../../../components/MessageList";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Feather } from "@expo/vector-icons";
import CustomKeyboardView from "../../../components/CustomKeyboardView";
import { useAuth } from "../../../context/authContext";
import { getRoomId, uploadMediaAsync } from "../../../utils/common";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db, rtdb, auth } from "../../../firebaseConfig";
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
import { ref, onValue, set, remove, push, get } from "firebase/database";
import * as ImagePicker from "expo-image-picker";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../../../firebaseConfig";
import { useCall } from "../../../context/callContext";
import { askChatGPT } from "../../../utils/openAIService.js";

// import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from "@env";

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun.l.google.com:5349",
    },
    {
      urls: "stun:stun1.l.google.com:3478",
    },
    {
      urls: "stun:stun1.l.google.com:5349",
    },
    {
      urls: "stun:stun2.l.google.com:19302",
    },
    {
      urls: "stun:stun2.l.google.com:5349",
    },
    {
      urls: "stun:stun3.l.google.com:3478",
    },
    {
      urls: "stun:stun3.l.google.com:5349",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    // {
    //   urls: "turn:global.relay.metered.ca:80",
    //   username: "02f239a44191a571afc2766c",
    //   credential: "eFW0JEJAEWcMnrmu",
    // },
    // {
    //   urls: "turn:global.relay.metered.ca:80?transport=tcp",
    //   username: "02f239a44191a571afc2766c",
    //   credential: "eFW0JEJAEWcMnrmu",
    // },
    // {
    //   urls: "turn:global.relay.metered.ca:443",
    //   username: "02f239a44191a571afc2766c",
    //   credential: "eFW0JEJAEWcMnrmu",
    // },
    // {
    //   urls: "turns:global.relay.metered.ca:443?transport=tcp",
    //   username: "02f239a44191a571afc2766c",
    //   credential: "eFW0JEJAEWcMnrmu",
    // },
  ],
};

export default function ChatRoom() {
  const item = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const textRef = useRef("");
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const pc = useRef(null);
  const callId = "test"; // Thay bằng logic tạo callId nếu cần
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const unsubscribeRefs = useRef([]);
  const { startCall } = useCall();

  const generateCallId = () => `${user.userId}-${item.userId}-${Date.now()}`;

  useEffect(() => {
    createRoomIfNotExists();
    let roomId = getRoomId(user?.userId, item?.userId);
    const docRef = doc(db, "rooms", roomId);
    const messageRef = collection(docRef, "messages");
    const q = query(messageRef, orderBy("createdAt", "asc"));
    let unsub = onSnapshot(q, (snapshot) => {
      let allMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages([...allMessages]);
    });

    const KeyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      updateScrollView
    );

    const offerRef = ref(rtdb, `calls/${callId}/offer`);
    const unsubOffer = onValue(offerRef, (snapshot) => {
      const offer = snapshot.val();
      if (offer && !isCaller) {
        setIncomingCall(true);
      }
    });
    // unsubscribeRefs.current.push(unsubOffer);

    return () => {
      unsub();
      KeyboardDidShowListener.remove();
      unsubscribeRefs.current.forEach((unsub) => unsub());
      remove(ref(rtdb, `calls/${callId}`));
      if (pc.current && pc.current.signalingState !== "closed") {
        pc.current.close();
      }
    };
  }, []);

  const createRoomIfNotExists = async () => {
    let roomId = getRoomId(user?.userId, item?.userId);
    await setDoc(doc(db, "rooms", roomId), {
      roomId,
      createdAt: Timestamp.fromDate(new Date()),
    });
  };

  // const setupConnection = async (role) => {
  //   try {
  //     const stream = await mediaDevices.getUserMedia({
  //       video: true,
  //       audio: true,
  //     });
  //     setLocalStream(stream);

  //     const newPC = new RTCPeerConnection(configuration);
  //     stream.getTracks().forEach((track) => {
  //       newPC.addTrack(track, stream);
  //     });

  //     newPC.onicecandidate = (event) => {
  //       if (event.candidate) {
  //         const candidateRef = ref(
  //           rtdb,
  //           `calls/${callId}/${
  //             role === "caller" ? "callerCandidates" : "calleeCandidates"
  //           }`
  //         );
  //         push(candidateRef, event.candidate);
  //         console.log(`${role} gửi ICE candidate:`, event.candidate);
  //       }
  //     };

  //     newPC.ontrack = (event) => {
  //       console.log("Nhận remote stream:", event.streams[0]);
  //       setRemoteStream(event.streams[0]);
  //     };

  //     newPC.oniceconnectionstatechange = () => {
  //       const state = newPC.iceConnectionState;
  //       console.log(`${role} ICE Connection State:`, state);
  //       if (state === "failed") {
  //         console.error(`${role} Kết nối ICE thất bại! Thử khởi động lại...`);
  //         newPC.restartIce(); // Khởi động lại quá trình ICE
  //       }
  //     };

  //     newPC.onicecandidateerror = (event) => {
  //       console.error("ICE Candidate Error:", event.errorText);
  //     };

  //     pc.current = newPC;
  //   } catch (error) {
  //     console.error("Lỗi trong setupConnection:", error.message);
  //   }
  // };

  // const endCall = () => {
  //   if (pc.current) {
  //     pc.current.getSenders().forEach((sender) => {
  //       if (sender.track) sender.track.stop();
  //     });
  //     pc.current.close();
  //     pc.current = null;
  //   }

  //   if (localStream) {
  //     localStream.getTracks().forEach((track) => track.stop());
  //     setLocalStream(null);
  //   }

  //   if (remoteStream) {
  //     remoteStream.getTracks().forEach((track) => track.stop());
  //     setRemoteStream(null);
  //   }

  //   remove(ref(rtdb, `calls/${callId}`));
  //   setIsCaller(false);
  //   setIncomingCall(false);
  //   setIsCalling(false);

  //   unsubscribeRefs.current.forEach((unsub) => unsub());
  //   unsubscribeRefs.current = [];
  // };

  const handleStartCall = async () => {
    const callId = generateCallId();
    await startCall(callId, item);
    router.push("/home/call-screen");
  };

  // const startCall = async () => {
  //   try {
  //     setIsCaller(true);
  //     setIsCalling(true);
  //     await setupConnection("caller");

  //     const offer = await pc.current.createOffer();
  //     await pc.current.setLocalDescription(offer);
  //     console.log("Caller gửi offer:", offer);

  //     await set(ref(rtdb, `calls/${callId}/offer`), offer);

  //     const answerRef = ref(rtdb, `calls/${callId}/answer`);
  //     const unsubAnswer = onValue(answerRef, async (snapshot) => {
  //       const answer = snapshot.val();
  //       if (answer && pc.current && !pc.current.currentRemoteDescription) {
  //         console.log("Caller nhận answer:", answer);
  //         await pc.current.setRemoteDescription(
  //           new RTCSessionDescription(answer)
  //         );
  //       }
  //     });
  //     unsubscribeRefs.current.push(unsubAnswer);

  //     const calleeCandidatesRef = ref(rtdb, `calls/${callId}/calleeCandidates`);
  //     const unsubCalleeCandidates = onValue(calleeCandidatesRef, (snapshot) => {
  //       snapshot.forEach((child) => {
  //         if (pc.current) {
  //           const candidate = new RTCIceCandidate(child.val());
  //           pc.current
  //             .addIceCandidate(candidate)
  //             .catch((error) =>
  //               console.error("Lỗi khi thêm ICE candidate cho caller:", error)
  //             );
  //           console.log("Caller nhận ICE candidate từ callee:", child.val());
  //         }
  //       });
  //     });
  //     unsubscribeRefs.current.push(unsubCalleeCandidates);
  //   } catch (error) {
  //     console.error("Lỗi trong startCall:", error.message);
  //   }
  // };

  // const acceptCall = async () => {
  //   try {
  //     setIncomingCall(false);
  //     setIsCalling(true);
  //     await setupConnection("callee");

  //     const offerSnapshot = await get(ref(rtdb, `calls/${callId}/offer`));
  //     const offer = offerSnapshot.val();
  //     console.log("Callee nhận offer:", offer);

  //     await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
  //     const answer = await pc.current.createAnswer();
  //     await pc.current.setLocalDescription(answer);
  //     console.log("Callee gửi answer:", answer);

  //     await set(ref(rtdb, `calls/${callId}/answer`), answer);

  //     const callerCandidatesRef = ref(rtdb, `calls/${callId}/callerCandidates`);
  //     const unsubCallerCandidates = onValue(callerCandidatesRef, (snapshot) => {
  //       snapshot.forEach((child) => {
  //         if (pc.current) {
  //           const candidate = new RTCIceCandidate(child.val());
  //           pc.current
  //             .addIceCandidate(candidate)
  //             .catch((error) =>
  //               console.error("Lỗi khi thêm ICE candidate cho callee:", error)
  //             );
  //           console.log("Callee nhận ICE candidate từ caller:", child.val());
  //         }
  //       });
  //     });
  //     unsubscribeRefs.current.push(unsubCallerCandidates);
  //   } catch (error) {
  //     console.error("Lỗi trong acceptCall:", error.message);
  //   }
  // };

  // const rejectCall = () => {
  //   setIncomingCall(false);
  //   remove(ref(rtdb, `calls/${callId}`));
  // };

  const handleSendMessage = async () => {
    let message = textRef.current.trim();
    if (!message) return;
    try {
      let roomId = getRoomId(user?.userId, item?.userId);
      const docRef = doc(db, "rooms", roomId);
      const messageRef = collection(docRef, "messages");

      textRef.current = "";
      if (inputRef) inputRef?.current?.clear();

      await addDoc(messageRef, {
        userId: user?.userId,
        text: message,
        profileUrl: user?.profileUrl,
        senderName: user?.username,
        createdAt: Timestamp.fromDate(new Date()),
      });

      // 3. Nếu đang chat với bot (item.userId === 'chatgpt-bot'), gọi API và lưu reply
      if (item?.userId === "chatgpt-bot") {
        // gọi OpenAI
        const aiReply = await askChatGPT(message);
        // lưu câu trả lời AI
        await addDoc(messageRef, {
          userId: "chatgpt-bot",
          text: aiReply,
          profileUrl: null,
          senderName: "ChatGPT",
          createdAt: Timestamp.fromDate(new Date()),
        });
      }
    } catch (e) {
      Alert.alert("Message", e.message);
    }
  };

  //uploadMediaAsync is in utils/common.js

  const handleSendMedia = async () => {
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
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!pickerResult.canceled) {
        const mediaUri = pickerResult.assets[0].uri;
        const mediaType = pickerResult.assets[0].type || "image";

        const downloadURL = await uploadMediaAsync(mediaUri, mediaType);

        let roomId = getRoomId(user?.userId, item?.userId);
        const docRef = doc(db, "rooms", roomId);
        const messageRef = collection(docRef, "messages");

        await addDoc(messageRef, {
          userId: user?.userId,
          mediaUrl: downloadURL,
          mediaType: mediaType,
          profileUrl: user?.profileUrl,
          senderName: user?.username,
          createdAt: Timestamp.fromDate(new Date()),
          type: mediaType,
        });

        console.log(`Uploaded ${mediaType} and saved to Firestore!`);
      }
    } catch (error) {
      console.error("Error uploading media: ", error);
      Alert.alert("Error", "Failed to upload media");
    }
  };

  const updateScrollView = () => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // if (incomingCall && !isCaller) {
  //   return (
  //     <View style={styles.incomingCallContainer}>
  //       <Text style={styles.incomingCallText}>Có cuộc gọi video đến...</Text>
  //       <View style={styles.buttonContainer}>
  //         <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
  //           <Text style={styles.buttonText}>Chấp nhận</Text>
  //         </TouchableOpacity>
  //         <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
  //           <Text style={styles.buttonText}>Từ chối</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // }

  // if (isCalling) {
  //   return (
  //     <View style={styles.fullScreenContainer}>
  //       {remoteStream ? (
  //         <RTCView
  //           streamURL={remoteStream.toURL()}
  //           style={styles.remoteVideo}
  //         />
  //       ) : (
  //         <Text style={styles.waitingText}>Đang chờ kết nối...</Text>
  //       )}
  //       {localStream && (
  //         <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
  //       )}
  //       <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
  //         <Text style={styles.endCallText}>Kết thúc cuộc gọi</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  const handleOpenMap = () => {
    let roomId = getRoomId(user?.userId, item?.userId);
    // console.log("this is chat room id: ", roomId);
    router.push({
      pathname: "/maps",
      params: {
        chatRoomId: roomId,
      },
    });
  };

  const deleteOneMessage = async (roomId, messageId, deleteForEveryone = false) => {
    try {
      const messageRef = doc(db, "rooms", roomId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);
  
      const messageData = messageDoc.data();
      if (!messageData) {
        throw new Error("Message not found");
      }
      
      if (deleteForEveryone) {
        await updateDoc(messageRef, {
          text: "This message was deleted",
          type: "deleted",
          deletedBy: user?.userId,
          isDeletedForEveryone: true,
        });
      } else {
        const deletedFor = messageData.deletedFor || [];
      if (!deletedFor.includes(user?.userId)) {
        await updateDoc(messageRef, {
          deletedFor: [...deletedFor, user?.userId]
        });
      }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  const handleDeleteOneMessage = async (
      messageId,
      deleteForEveryone = false
    ) => {
      // console.log("this is messageId: ", messageId);
      Alert.alert(
        "Delete message",
        `Are you sure you want to delete this message${
          deleteForEveryone ? " for everyone" : ""
        }?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                let roomId = getRoomId(user?.userId, item?.userId);
                await deleteOneMessage(roomId, messageId, deleteForEveryone);
              } catch (error) {
                Alert.alert("Error", "Cannot delete message");
                console.error("Error deleting message:", error);}
            },
          },
        ]
      );
    };

  return (
    //<SafeAreaView style={styles.container}>
    <CustomKeyboardView inChat={true}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View className="flex-1 bg-white">
        <ChatRoomHeader
          user={item}
          router={router}
          startCall={handleStartCall}
          // acceptCall={acceptCall}
          // incomingCall={incomingCall}
          // isCaller={isCaller}
        />
        <View className="h3 border-b border-neutral-300 " />
        <View className="flex-1 justify-between bg-neutral-100 overflow-visible">
          <View className="flex-1">
            <MessageList
              scrollViewRef={scrollViewRef}
              currentUser={user}
              messages={messages}
              onDeleteMessage={handleDeleteOneMessage}
            />
          </View>
          <View className="pt-2 px-1" style={{ marginBottom: hp(1.7) }}>
            <View className="flex-row justify-between items-center mx-3">
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => handleOpenMap()}
                  className="bg-neutral-200 p-2 mr-2 rounded-full"
                >
                  <Feather name="map" size={hp(2.7)} color="mediumpurple" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSendMedia()}
                  className="bg-neutral-200 p-2 mr-2 rounded-full"
                >
                  <Feather name="image" size={hp(2.7)} color="mediumpurple" />
                </TouchableOpacity>
                {/* <TouchableOpacity
                  onPress={() => handleSendMedia()}
                  className="bg-neutral-200 p-2 mr-2 rounded-full"
                >
                  <Feather name="video" size={hp(2.7)} color="mediumpurple" />
                </TouchableOpacity> */}
              </View>
              <View className="flex-1 flex-row justify-between bg-white border p-2 border-neutral-300 rounded-full pl-5">
                <TextInput
                  ref={inputRef}
                  onChangeText={(value) => (textRef.current = value)}
                  placeholder="Type message..."
                  style={{ fontSize: hp(2) }}
                  className="flex-1 mr-2"
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  className="bg-neutral-200 p-2 mr-[1px] rounded-full"
                >
                  <Feather name="send" size={hp(2.7)} color="mediumpurple" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </CustomKeyboardView>
    //</SafeAreaView>
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
  remoteVideo: {
    width: "100%",
    height: "100%",
    zIndex: 1,
    position: "absolute",
  },
  localVideo: {
    width: wp(30),
    height: hp(20),
    position: "absolute",
    top: hp(2),
    right: wp(2),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 2,
  },
  endCallButton: {
    position: "absolute",
    bottom: hp(5),
    alignSelf: "center",
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
