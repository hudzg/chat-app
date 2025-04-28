import { View, Text, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Entypo, Ionicons } from "@expo/vector-icons";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Image } from "expo-image";
import { blurhash } from "../utils/common";
import React from "react";

export default function ChatRoomHeader({
  user,
  router,
  startCall,
  acceptCall,
  incomingCall,
  isCaller,
  groupName,
  isGroup,
  onAddMembers,
  onViewMembers,
  onDeleteChat,
  onLeaveGroup,
  isAdmin,
}) {
  return (
    <Stack.Screen
      options={{
        title: "",
        headerShadowVisible: false,
        headerLeft: () => (
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              style={{ borderWidth: 2, borderColor: "red" }}
              onPressIn={() => router.back()}
            >
              <Entypo name="chevron-left" size={hp(4)} color="#737373" />
            </TouchableOpacity>
            <View className="flex-row items-center gap-3">
              <Image
                source={
                  isGroup
                    ? require("../assets/images/group-icon.png")
                    : user?.profileUrl
                }
                style={{ height: hp(4.5), aspectRatio: 1, borderRadius: 100 }}
                placeholder={{ blurhash }}
              />
              <Text
                style={{ fontSize: hp(2.5) }}
                className="text-neutral-700 font-medium"
              >
                {isGroup ? groupName : user?.username}
              </Text>
            </View>
          </View>
        ),
        headerRight: () => (
          <View className="flex-row items-center gap-8">
            <Ionicons name="call" size={hp(2.8)} color="#737373" />
            <TouchableOpacity onPress={startCall}>
              <Ionicons name="videocam" size={hp(2.8)} color="#737373" />
            </TouchableOpacity>

            <Menu>
              <MenuTrigger>
                <Ionicons
                  name="ellipsis-vertical"
                  size={hp(2.8)}
                  color="#737373"
                />
              </MenuTrigger>
              <MenuOptions
                optionsContainerStyle={{
                  borderRadius: 12,
                  marginTop: 30,
                  width: 200,
                  padding: 5,
                }}
              >
                {isGroup && isAdmin && (
                  <View>
                    <MenuOption onSelect={onAddMembers}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons
                          name="person-add"
                          size={hp(2.2)}
                          color="#737373"
                        />
                        <Text style={{ fontSize: hp(1.8) }}>Add members</Text>
                      </View>
                    </MenuOption>

                    <MenuOption onSelect={onViewMembers}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons
                          name="people"
                          size={hp(2.2)}
                          color="#737373"
                        />
                        <Text style={{ fontSize: hp(1.8) }}>Members</Text>
                      </View>
                    </MenuOption>
                  </View>
                )}
                {isGroup && (
                  <View>
                    <MenuOption onSelect={onDeleteChat}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons name="trash-outline" size={hp(2.2)} color="#ff4444" />
                        <Text style={{ fontSize: hp(1.8), color: "#ff4444" }}>
                          Delete Chat
                        </Text>
                      </View>
                    </MenuOption>
                    <MenuOption onSelect={onLeaveGroup}>
                      <View className="flex-row items-center gap-2 p-2">
                        <Ionicons name="exit-outline" size={hp(2.2)} color="#ff4444" />
                        <Text style={{ fontSize: hp(1.8), color: "#ff4444" }}>
                          Leave Group
                        </Text>
                      </View>
                    </MenuOption>
                  </View>
                )}
              </MenuOptions>
            </Menu>
          </View>
        ),
      }}
    />
  );
}

// import { View, Text, TouchableOpacity, Button } from "react-native";
// import { Stack } from "expo-router";
// import { Entypo, Ionicons } from "@expo/vector-icons";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import { Image } from "expo-image";
// import { blurhash } from "../utils/common";
// import { ref, onValue, set, remove, push, get } from "firebase/database";
// import {
//   RTCPeerConnection,
//   RTCView,
//   mediaDevices,
//   RTCIceCandidate,
//   RTCSessionDescription,
// } from "react-native-webrtc";
// import React, { useEffect, useRef, useState } from "react";
// import { rtdb } from "../firebaseConfig";

// const configuration = {
//   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// };

// export default function ChatRoomHeader({ user, router }) {
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const pc = useRef(null); // Lưu trữ RTCPeerConnection
//   const callId = "test";
//   const [isCaller, setIsCaller] = useState(false);
//   const [incomingCall, setIncomingCall] = useState(false);
//   // const rtdb = getDatabase(); // Firebase Realtime Database

//   useEffect(() => {
//     const setupMedia = async () => {
//       try {
//         // const stream = await mediaDevices.getUserMedia({
//         //   video: true,
//         //   audio: true,
//         // });
//         // setLocalStream(stream);

//         // Callee lắng nghe offer (vì Callee chưa có peerConnection)
//         const offerRef = ref(rtdb, `calls/${callId}/offer`);
//         onValue(offerRef, (snapshot) => {
//           const offer = snapshot.val();
//           if (offer && !isCaller) {
//             setIncomingCall(true);
//           }
//         });
//       } catch (error) {
//         console.error("Lỗi khi lấy media:", error.message);
//       }
//     };

//     setupMedia();

//     return () => {
//       remove(ref(rtdb, `calls/${callId}`));
//       if (pc.current && pc.current.signalingState !== "closed") {
//         pc.current.close();
//       }
//     };
//   }, []);

//   const setupConnection = async (role) => {
//     // Tạo local stream
//     const stream = await mediaDevices.getUserMedia({
//       video: true,
//       audio: true,
//     });
//     setLocalStream(stream);

//     // Tạo peer connection
//     const newPC = new RTCPeerConnection(configuration);

//     // Thêm track vào peer
//     stream.getTracks().forEach((track) => {
//       newPC.addTrack(track, stream);
//     });

//     // Gửi ICE candidate
//     newPC.onicecandidate = (event) => {
//       if (event.candidate) {
//         const candidateRef = ref(
//           rtdb,
//           `calls/${callId}/${
//             role === "caller" ? "callerCandidates" : "calleeCandidates"
//           }`
//         );
//         push(candidateRef, event.candidate.toJSON());
//       }
//     };

//     // Nhận remote stream
//     newPC.ontrack = (event) => {
//       setRemoteStream(event.streams[0]);
//     };

//     // Lưu peer vào ref
//     pc.current = newPC;
//   };

//   const endCall = () => {
//     if (pc.current) {
//       pc.current.getSenders().forEach((sender) => {
//         if (sender.track) {
//           sender.track.stop();
//         }
//       });
//       pc.current.close();
//       pc.current = null;
//     }

//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       setLocalStream(null);
//     }

//     if (remoteStream) {
//       remoteStream.getTracks().forEach((track) => track.stop());
//       setRemoteStream(null);
//     }

//     // Xoá dữ liệu call trên Firebase
//     remove(ref(rtdb, `calls/${callId}`));

//     setIsCaller(false);
//     setIncomingCall(false);

//     console.log("Đã kết thúc cuộc gọi và dọn dẹp mọi thứ!");
//   };

//   const startCall = async () => {
//     try {
//       // endCall();
//       await setupConnection("caller");

//       const offer = await pc.current.createOffer();
//       await pc.current.setLocalDescription(offer);

//       await set(ref(rtdb, `calls/${callId}/offer`), offer);

//       // Nghe answer sau khi gửi offer
//       const answerRef = ref(rtdb, `calls/${callId}/answer`);
//       onValue(answerRef, async (snapshot) => {
//         const answer = snapshot.val();
//         if (answer && pc.current && !pc.current.currentRemoteDescription) {
//           await pc.current.setRemoteDescription(
//             new RTCSessionDescription(answer)
//           );
//         }
//       });

//       // Nghe ICE từ callee
//       const calleeCandidatesRef = ref(rtdb, `calls/${callId}/calleeCandidates`);
//       onValue(calleeCandidatesRef, (snapshot) => {
//         snapshot.forEach((child) => {
//           const candidate = new RTCIceCandidate(child.val());
//           pc.current.addIceCandidate(candidate);
//         });
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const acceptCall = async () => {
//     // endCall();
//     setIncomingCall(false);
//     await setupConnection("callee");

//     const offerSnapshot = await get(ref(rtdb, `calls/${callId}/offer`));
//     const offer = offerSnapshot.val();

//     await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
//     const answer = await pc.current.createAnswer();
//     await pc.current.setLocalDescription(answer);
//     await set(ref(rtdb, `calls/${callId}/answer`), answer);

//     // Nghe ICE từ caller
//     const callerCandidatesRef = ref(rtdb, `calls/${callId}/callerCandidates`);
//     onValue(callerCandidatesRef, (snapshot) => {
//       snapshot.forEach((child) => {
//         const candidate = new RTCIceCandidate(child.val());
//         pc.current.addIceCandidate(candidate);
//       });
//     });
//   };

//   return (
//     <Stack.Screen
//       options={{
//         title: "",
//         headerShadowVisible: false,
//         headerLeft: () => (
//           <View className="flex-row items-center gap-4">
//             <View style={{ flex: 1, padding: 20 }}>
//               <Text style={{ fontSize: 16, marginBottom: 10 }}>
//                 {isCaller ? "Bạn là người gọi" : "Chờ cuộc gọi đến..."}
//               </Text>
//               {localStream && (
//                 <RTCView
//                   streamURL={localStream.toURL()}
//                   style={{ width: 150, height: 200, backgroundColor: "black" }}
//                 />
//               )}
//               {remoteStream && (
//                 <RTCView
//                   streamURL={remoteStream.toURL()}
//                   style={{
//                     width: 150,
//                     height: 200,
//                     backgroundColor: "black",
//                     marginVertical: 10,
//                   }}
//                 />
//               )}

//               {!isCaller && incomingCall && (
//                 <Button title="Chấp nhận cuộc gọi" onPress={acceptCall} />
//               )}
//               {!isCaller && !incomingCall && (
//                 <Text style={{ marginTop: 10 }}>Không có cuộc gọi nào</Text>
//               )}
//               {isCaller === false && <Button title="Gọi" onPress={startCall} />}
//               <Button title="Kết thúc cuộc gọi" color="red" onPress={endCall} />
//             </View>
//             <TouchableOpacity
//               style={{ borderWidth: 2, borderColor: "red" }}
//               onPressIn={() => router.back()}
//             >
//               <Entypo name="chevron-left" size={hp(4)} color="#737373" />
//             </TouchableOpacity>
//             <View className="flex-row items-center gap-3">
//               <Image
//                 source={user?.profileUrl}
//                 style={{ height: hp(4.5), aspectRatio: 1, borderRadius: 100 }}
//                 placeholder={{ blurhash }}
//               />
//               <Text
//                 style={{ fontSize: hp(2.5) }}
//                 className="text-neutral-700 font-medium"
//               >
//                 {user?.username}
//               </Text>
//             </View>
//           </View>
//         ),
//         headerRight: () => (
//           <View className="flex-row items-center gap-8">
//             <Ionicons name="call" size={hp(2.8)} color="#737373" />
//             <TouchableOpacity
//               onPressIn={() => {
//                 console.log("cam");
//                 createOffer();
//               }}
//             >
//               <Ionicons name="videocam" size={hp(2.8)} color="#737373" />
//             </TouchableOpacity>
//           </View>
//         ),
//       }}
//     />
//   );
// }
