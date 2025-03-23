import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  StyleSheet,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ChatRoomHeader from "../../components/ChatRoomHeader";
import MessageList from "../../components/MessageList";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Feather } from "@expo/vector-icons";
import CustomKeyboardView from "../../components/CustomKeyboardView";
import { useAuth } from "../../context/authContext";
import { getRoomId } from "../../utils/common";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db, rtdb } from "../../firebaseConfig";
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
import { ref, onValue, set, remove, push, get } from "firebase/database";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.anyfirewall.com:3478" },
    { urls: "stun:stun.ekiga.net:3478" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceTransportPolicy: "relay",
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

  useEffect(() => {
    createRoomIfNotExists();
    let roomId = getRoomId(user?.userId, item?.userId);
    const docRef = doc(db, "rooms", roomId);
    const messageRef = collection(docRef, "messages");
    const q = query(messageRef, orderBy("createdAt", "asc"));
    let unsub = onSnapshot(q, (snapshot) => {
      let allMessages = snapshot.docs.map((doc) => doc.data());
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
    unsubscribeRefs.current.push(unsubOffer);

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

  const setupConnection = async (role) => {
    try {
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      const newPC = new RTCPeerConnection(configuration);
      stream.getTracks().forEach((track) => {
        newPC.addTrack(track, stream);
      });

      newPC.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = ref(
            rtdb,
            `calls/${callId}/${
              role === "caller" ? "callerCandidates" : "calleeCandidates"
            }`
          );
          push(candidateRef, event.candidate);
          console.log(`${role} gửi ICE candidate:`, event.candidate);
        }
      };

      newPC.ontrack = (event) => {
        console.log("Nhận remote stream:", event.streams[0]);
        setRemoteStream(event.streams[0]);
      };

      newPC.oniceconnectionstatechange = () => {
        const state = newPC.iceConnectionState;
        console.log("ICE Connection State:", state);
        if (state === "failed") {
          console.error("Kết nối ICE thất bại!");
        }
      };

      newPC.onicecandidateerror = (event) => {
        console.error("ICE Candidate Error:", event.errorText);
      };

      pc.current = newPC;
    } catch (error) {
      console.error("Lỗi trong setupConnection:", error.message);
    }
  };

  const endCall = () => {
    if (pc.current) {
      pc.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      pc.current.close();
      pc.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    remove(ref(rtdb, `calls/${callId}`));
    setIsCaller(false);
    setIncomingCall(false);
    setIsCalling(false);

    unsubscribeRefs.current.forEach((unsub) => unsub());
    unsubscribeRefs.current = [];
  };

  const startCall = async () => {
    try {
      setIsCaller(true);
      setIsCalling(true);
      await setupConnection("caller");

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      console.log("Caller gửi offer:", offer);

      await set(ref(rtdb, `calls/${callId}/offer`), offer);

      const answerRef = ref(rtdb, `calls/${callId}/answer`);
      const unsubAnswer = onValue(answerRef, async (snapshot) => {
        const answer = snapshot.val();
        if (answer && pc.current && !pc.current.currentRemoteDescription) {
          console.log("Caller nhận answer:", answer);
          await pc.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      });
      unsubscribeRefs.current.push(unsubAnswer);

      const calleeCandidatesRef = ref(rtdb, `calls/${callId}/calleeCandidates`);
      const unsubCalleeCandidates = onValue(calleeCandidatesRef, (snapshot) => {
        snapshot.forEach((child) => {
          if (pc.current) {
            const candidate = new RTCIceCandidate(child.val());
            pc.current
              .addIceCandidate(candidate)
              .catch((error) =>
                console.error("Lỗi khi thêm ICE candidate cho caller:", error)
              );
            console.log("Caller nhận ICE candidate từ callee:", child.val());
          }
        });
      });
      unsubscribeRefs.current.push(unsubCalleeCandidates);
    } catch (error) {
      console.error("Lỗi trong startCall:", error.message);
    }
  };

  const acceptCall = async () => {
    try {
      setIncomingCall(false);
      setIsCalling(true);
      await setupConnection("callee");

      const offerSnapshot = await get(ref(rtdb, `calls/${callId}/offer`));
      const offer = offerSnapshot.val();
      console.log("Callee nhận offer:", offer);

      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      console.log("Callee gửi answer:", answer);

      await set(ref(rtdb, `calls/${callId}/answer`), answer);

      const callerCandidatesRef = ref(rtdb, `calls/${callId}/callerCandidates`);
      const unsubCallerCandidates = onValue(callerCandidatesRef, (snapshot) => {
        snapshot.forEach((child) => {
          if (pc.current) {
            const candidate = new RTCIceCandidate(child.val());
            pc.current
              .addIceCandidate(candidate)
              .catch((error) =>
                console.error("Lỗi khi thêm ICE candidate cho callee:", error)
              );
            console.log("Callee nhận ICE candidate từ caller:", child.val());
          }
        });
      });
      unsubscribeRefs.current.push(unsubCallerCandidates);
    } catch (error) {
      console.error("Lỗi trong acceptCall:", error.message);
    }
  };

  const rejectCall = () => {
    setIncomingCall(false);
    remove(ref(rtdb, `calls/${callId}`));
  };

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
    } catch (e) {
      Alert.alert("Message", e.message);
    }
  };

  const updateScrollView = () => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 100);
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

  if (isCalling) {
    return (
      <View style={styles.fullScreenContainer}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
          />
        ) : (
          <Text style={styles.waitingText}>Đang chờ kết nối...</Text>
        )}
        {localStream && (
          <RTCView streamURL={localStream.toURL()} style={styles.localVideo} />
        )}
        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <Text style={styles.endCallText}>Kết thúc cuộc gọi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CustomKeyboardView inChat={true}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        <ChatRoomHeader
          user={item}
          router={router}
          startCall={startCall}
          acceptCall={acceptCall}
          incomingCall={incomingCall}
          isCaller={isCaller}
        />
        <View className="h3 border-b border-neutral-300 " />
        <View className="flex-1 justify-between bg-neutral-100 overflow-visible">
          <View className="flex-1">
            <MessageList
              scrollViewRef={scrollViewRef}
              currentUser={user}
              messages={messages}
            />
          </View>
          <View className="pt-2" style={{ marginBottom: hp(1.7) }}>
            <View className="flex-row justify-between items-center mx-3">
              <View className="flex-row justify-between bg-white border p-2 border-neutral-300 rounded-full pl-5">
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
                  <Feather name="send" size={hp(2.7)} color="#737373" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </CustomKeyboardView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
    zIndex: 30,
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
    zIndex: 20,
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

// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   Keyboard,
// } from "react-native";
// import React, { useEffect, useRef, useState } from "react";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import ChatRoomHeader from "../../components/ChatRoomHeader";
// import MessageList from "../../components/MessageList";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import { Feather } from "@expo/vector-icons";
// import CustomKeyboardView from "../../components/CustomKeyboardView";
// import { useAuth } from "../../context/authContext";
// import { getRoomId } from "../../utils/common";
// import {
//   addDoc,
//   collection,
//   doc,
//   onSnapshot,
//   orderBy,
//   query,
//   setDoc,
//   Timestamp,
// } from "firebase/firestore";
// import { db } from "../../firebaseConfig";

// export default function chatRoom() {
//   const item = useLocalSearchParams();
//   const router = useRouter();
//   const { user } = useAuth();
//   const [messages, setMessages] = useState([]);
//   const textRef = useRef("");
//   const inputRef = useRef(null);
//   const scrollViewRef = useRef(null);

//   useEffect(() => {
//     createRoomIfNotExists();
//     let roomId = getRoomId(user?.userId, item?.userId);
//     const docRef = doc(db, "rooms", roomId);
//     const messageRef = collection(docRef, "messages");
//     const q = query(messageRef, orderBy("createdAt", "asc"));
//     let unsub = onSnapshot(q, (snapshot) => {
//       let allMessages = snapshot.docs.map((doc) => {
//         return doc.data();
//       });
//       setMessages([...allMessages]);
//     });

//     const KeyboardDidShowListener = Keyboard.addListener(
//       "keyboardDidShow",
//       updateScrollView
//     );
//     return () => {
//       unsub();
//       KeyboardDidShowListener.remove();
//     };
//   }, []);

//   const createRoomIfNotExists = async () => {
//     let roomId = getRoomId(user?.userId, item?.userId);
//     await setDoc(doc(db, "rooms", roomId), {
//       roomId,
//       createdAt: Timestamp.fromDate(new Date()),
//     });
//   };

//   const handleSendMessage = async () => {
//     let message = textRef.current.trim();
//     if (!message) return;
//     try {
//       let roomId = getRoomId(user?.userId, item?.userId);
//       const docRef = doc(db, "rooms", roomId);
//       const messageRef = collection(docRef, "messages");

//       textRef.current = "";
//       if (inputRef) inputRef?.current?.clear();

//       const newDoc = await addDoc(messageRef, {
//         userId: user?.userId,
//         text: message,
//         profileUrl: user?.profileUrl,
//         senderName: user?.username,
//         createdAt: Timestamp.fromDate(new Date()),
//       });

//       console.log(newDoc.id);
//     } catch (e) {
//       Alert.alert("Message", e.message);
//     }
//   };

//   useEffect(() => {
//     updateScrollView();
//   }, [messages]);

//   const updateScrollView = () => {
//     setTimeout(() => {
//       scrollViewRef?.current?.scrollToEnd({ animated: true });
//     }, 100);
//   };

//   return (
//     <CustomKeyboardView inChat={true}>
//       <View className="flex-1 bg-white">
//         <StatusBar style="dark" />
//         <ChatRoomHeader user={item} router={router} />
//         <View className="h3 border-b border-neutral-300 " />
//         <View className="flex-1 justify-between bg-neutral-100 overflow-visible">
//           <View className="flex-1">
//             <MessageList
//               scrollViewRef={scrollViewRef}
//               currentUser={user}
//               messages={messages}
//             />
//           </View>
//           <View className="pt-2" style={{ marginBottom: hp(1.7) }}>
//             <View className="flex-row justify-between items-center mx-3">
//               <View className="flex-row justify-between bg-white border p-2 border-neutral-300 rounded-full pl-5">
//                 <TextInput
//                   ref={inputRef}
//                   onChangeText={(value) => (textRef.current = value)}
//                   placeholder="Type message..."
//                   style={{ fontSize: hp(2) }}
//                   className="flex-1 mr-2"
//                 />
//                 <TouchableOpacity
//                   onPress={handleSendMessage}
//                   className="bg-neutral-200 p-2 mr-[1px] rounded-full"
//                 >
//                   <Feather name="send" size={hp(2.7)} color="#737373" />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </View>
//       </View>
//     </CustomKeyboardView>
//   );
// }
