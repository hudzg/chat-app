import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";
import BackgroundActions from "react-native-background-actions";
import { ref, set, get, remove, onValue, push } from "firebase/database";
import { db, rtdb, firebaseConfig } from "../firebaseConfig";
import { useAuth } from "./authContext";
import { doc, getDoc } from "firebase/firestore";

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
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "02f239a44191a571afc2766c",
      credential: "eFW0JEJAEWcMnrmu",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "02f239a44191a571afc2766c",
      credential: "eFW0JEJAEWcMnrmu",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "02f239a44191a571afc2766c",
      credential: "eFW0JEJAEWcMnrmu",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "02f239a44191a571afc2766c",
      credential: "eFW0JEJAEWcMnrmu",
    },
  ],
};

const CallContext = createContext();

export function CallProvider({ children }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callData, setCallData] = useState(null);
  const pc = useRef(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const unsubscribeIncomingCall = listenForIncomingCalls();
      // registerBackgroundFetchAsync();
      // console.log("user in CallProvider:", user);

      return () => {
        cleanupCall();
        unsubscribeIncomingCall?.();
      };
    }
  }, [user]);

  const listenForIncomingCalls = () => {
    try {
      const callsRef = ref(rtdb, "calls");
      return onValue(callsRef, async (snapshot) => {
        const calls = snapshot.val();
        if (!calls) return;

        for (const callId in calls) {
          const call = calls[callId];
          console.log("call.to", call.to);
          console.log("userId", user.userId);
          // console.log("call.offer", call.offer);
          // console.log("call.answer", call.answer);
          if (call.offer && call.to === user.userId && !call.answer) {
            console.log("hung");
            const callerDoc = doc(db, "users", call.from);
            const callerSnapshot = await getDoc(callerDoc);
            const callerData = callerSnapshot.data();

            console.log("hung2");

            if (!isCalling && !incomingCall) {
              handleIncomingCall(callId, callerData);
            }
            break;
          }
        }
      });
    } catch (error) {
      console.error("Error setting up call listener:", error);
    }
  };

  const setupConnection = async (role, callId) => {
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
          const candidateRef = push(
            ref(
              rtdb,
              `calls/${callId}/${
                role === "caller" ? "callerCandidates" : "calleeCandidates"
              }`
            )
          );
          set(candidateRef, event.candidate);
        }
      };

      newPC.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Handle ICE connection state changes
      newPC.oniceconnectionstatechange = () => {
        console.log("ICE connection state changed:", newPC.iceConnectionState);
        if (newPC.iceConnectionState === "failed") {
          console.log("ICE connection failed");
          newPC.restartIce();
        }
      };

      pc.current = newPC;
      // await startBackgroundTask();
    } catch (error) {
      console.error("Error in setupConnection:", error);
      throw error;
    }
  };

  const startCall = async (callId, remoteUser) => {
    try {
      setIsCaller(true);
      setIsCalling(true);
      setCallData({ callId, remoteUser });

      await setupConnection("caller", callId);

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);

      await set(ref(rtdb, `calls/${callId}`), {
        from: user.userId,
        to: remoteUser.userId,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        createdAt: new Date().toISOString(),
      });

      // Listen for answer
      onValue(ref(rtdb, `calls/${callId}/answer`), async (snapshot) => {
        const answer = snapshot.val();
        if (answer && pc.current && !pc.current.currentRemoteDescription) {
          await pc.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      });

      let addedCandidateCount = 0;

      // Listen for remote candidates
      onValue(ref(rtdb, `calls/${callId}/calleeCandidates`), (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const candidate = childSnapshot.val();
          pc.current?.addIceCandidate(candidate);
          addedCandidateCount++;
          console.log("🔢 Total candidates added:", addedCandidateCount);
        });
      });
    } catch (error) {
      console.error("Error in startCall:", error);
      endCall();
    }
  };

  const acceptCall = async () => {
    try {
      if (!callData) return;

      setIncomingCall(false);
      setIsCalling(true);
      await setupConnection("callee", callData.callId);

      const offerSnapshot = await get(
        ref(rtdb, `calls/${callData.callId}/offer`)
      );
      const offer = offerSnapshot.val();

      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      await set(ref(rtdb, `calls/${callData.callId}/answer`), {
        type: answer.type,
        sdp: answer.sdp,
      });

      // Listen for remote candidates
      onValue(
        ref(rtdb, `calls/${callData.callId}/callerCandidates`),
        (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            const candidate = childSnapshot.val();
            pc.current?.addIceCandidate(candidate);
          });
        }
      );
    } catch (error) {
      console.error("Error in acceptCall:", error);
      endCall();
    }
  };

  const handleIncomingCall = (callId, callerData) => {
    setIncomingCall(true);
    setCallData({ callId, remoteUser: callerData });
    router.push("/home/call-screen");
  };

  const endCall = async () => {
    try {
      if (callData) {
        await remove(ref(rtdb, `calls/${callData.callId}`));
      }

      cleanupCall();
      router.back();
    } catch (error) {
      console.error("Error in endCall:", error);
    }
  };

  const cleanupCall = async () => {
    try {
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

      setIsCaller(false);
      setIncomingCall(false);
      setIsCalling(false);
      setCallData(null);
    } catch (error) {
      console.error("Error in cleanupCall:", error);
    }
  };

  return (
    <CallContext.Provider
      value={{
        localStream,
        remoteStream,
        isCalling,
        isCaller,
        incomingCall,
        startCall,
        acceptCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
