import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
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

const GroupCallContext = createContext();

export function GroupCallProvider({ children }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isCalling, setIsCalling] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callData, setCallData] = useState(null);
  // const [peerConnections, setPeerConnections] = useState({}); // Object to store multiple peer connections
  const peerConnections = useRef({});
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
      const callsRef = ref(rtdb, "group-calls");
      return onValue(callsRef, async (snapshot) => {
        const calls = snapshot.val();
        if (!calls || isCalling) return;

        for (const callId in calls) {
          const call = calls[callId];

          // Skip if user is already in a call
          if (isCalling) continue;

          //   console.log("Incoming call data:", call.participants[user.userId]);

          // Check if this call is active and user isn't already a participant
          if (call.participants && !call.participants[user.userId]) {
            // Get initiator's data
            const initiatorDoc = doc(db, "users", call.initiator);
            const initiatorSnapshot = await getDoc(initiatorDoc);
            const initiatorData = initiatorSnapshot.data();

            // console.log(initiatorData ? "hung" : "hung2");

            // Handle incoming group call
            // print(initiatorDoc);
            handleIncomingCall(callId, {
              ...initiatorData,
              participantsCount: Object.keys(call.participants).length,
            });
            // handleIncomingCall(callId, initiatorData);
            break;
          }
        }
      });
    } catch (error) {
      console.error("Error setting up call listener:", error);
    }
  };

  const listenPeerConnections = async (callId, stream) => {
    try {
      onValue(ref(rtdb, `group-calls/${callId}/offers`), async (snapshot) => {
        const offers = snapshot.val() || {};
        for (const [key, offer] of Object.entries(offers)) {
          const [from, to] = key.split("_");
          if (to === user.userId && !peerConnections.current[from]) {
            console.log("Incoming offer from:", from);
            const peerConnection = new RTCPeerConnection(configuration);
            peerConnections.current[from] = peerConnection;

            stream.getTracks().forEach((track) => {
              peerConnection.addTrack(track, stream);
            });

            // const newStream = new MediaStream([]);
            // setRemoteStreams((prev) => ({
            //   ...prev,
            //   [from]: newStream,
            // }));

            // peerConnection.ontrack = (event) => {
            //   event.streams[0].getTracks().forEach((track) => {
            //     // const remoteStream = remoteStreams[from];
            //     // remoteStream.addTrack(track);
            //     // setRemoteStreams((prev) => ({
            //     //   ...prev,
            //     //   [from]: remoteStream,
            //     // }));
            //     newStream.addTrack(track);
            //   });
            // };

            peerConnection.ontrack = (event) => {
              console.log(
                "Received track in listenPeerConnections:",
                event.streams[0]
              );
              const [remoteStream] = event.streams;
              setRemoteStreams((prev) => ({
                ...prev,
                [from]: remoteStream,
              }));
            };

            peerConnection.onicecandidate = (event) => {
              if (event.candidate) {
                // console.log("ICE candidate:", event.candidate);
                const candidateRef = push(
                  ref(
                    rtdb,
                    `group-calls/${callId}/candidates/${user.userId}_${from}`
                  )
                );
                set(candidateRef, event.candidate.toJSON());
              }
            };

            peerConnection.oniceconnectionstatechange = () => {
              console.log(
                "oniceconnectionstatechange",
                peerConnection.iceConnectionState
              );
            };

            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(offer)
            );

            const answerDescription = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answerDescription);

            await set(
              ref(rtdb, `group-calls/${callId}/answers/${from}_${user.userId}`),
              {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
              }
            );

            let addedCandidateCount = 0;

            onValue(
              ref(
                rtdb,
                `group-calls/${callId}/candidates/${from}_${user.userId}`
              ),
              async (snapshot) => {
                if (!snapshot.exists()) return;

                const candidates = snapshot.val();
                // Iterate through all candidates in the snapshot
                for (const [key, candidateData] of Object.entries(candidates)) {
                  try {
                    // console.log(`Adding ICE candidate ${key} from ${from}`);
                    // console.log("candidate data:", candidateData);

                    // Create new RTCIceCandidate from the candidate data
                    const candidate = new RTCIceCandidate(candidateData);
                    await peerConnection.addIceCandidate(candidate);
                    // console.log(`Successfully added ICE candidate ${key}`);
                  } catch (error) {
                    console.error(
                      `Error adding ICE candidate from ${participant.userId}:`,
                      error
                    );
                  }
                }
              }
            );

            // setPeerConnections((prev) => ({
            //   ...prev,
            //   [from]: peerConnection,
            // }));
            peerConnections.current[from] = peerConnection;
          }
        }
      });
    } catch (error) {
      console.error("Error in listenPeerConnections:", error);
      endCall();
    }
  };

  const startCall = async (callId, initialParticipant) => {
    // console.log("Starting call with ID:", callId);
    try {
      setIsInitiator(true);
      setIsCalling(true);
      setCallData({ callId, participants: [initialParticipant] });

      // Initiator only sets up their stream without creating RTCPeerConnection
      //   console.log("localStream", stream);
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      //   console.log("localStream", stream);

      // Create the initial call entry
      await set(ref(rtdb, `group-calls/${callId}`), {
        participants: {
          [user.userId]: {
            userId: user.userId,
            joinedAt: new Date().toISOString(),
          },
        },
        initiator: user.userId,
        createdAt: new Date().toISOString(),
      });

      listenPeerConnections(callId, stream);
    } catch (error) {
      console.error("Error in startCall:", error);
      endCall();
    }
  };

  const registerPeerConnection = async (callId, stream) => {
    try {
      // print("hung");
      // Get current participants
      const callSnapshot = await get(ref(rtdb, `group-calls/${callId}`));
      const callData = callSnapshot.val();

      if (!callData) throw new Error("Call not found");
      const currentParticipants = Object.values(callData.participants || {});
      for (const participant of currentParticipants) {
        // const newStream = new MediaStream([]);
        // setRemoteStreams((prev) => ({
        //   ...prev,
        //   [participant.userId]: newStream,
        // }));
        // setRemoteStreams((prev) => ({
        //   ...prev,
        //   [participant.userId]: new MediaStream([]),
        // }));

        const peerConnection = new RTCPeerConnection(configuration);

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        // console.log("registerPeerConnection stream", stream);

        // peerConnection.ontrack = (event) => {
        //   event.streams[0].getTracks().forEach((track) => {
        //     // const remoteStream = remoteStreams[participant.userId];
        //     // remoteStream.addTrack(track);

        //     // setRemoteStreams((prev) => ({
        //     //   ...prev,
        //     //   [participant.userId]: remoteStream,
        //     // }));
        //     newStream.addTrack(track);
        //     setRemoteStreams((prev) => ({
        //       ...prev,
        //       [participant.userId]: newStream,
        //     }));
        //   });
        // };

        peerConnection.ontrack = (event) => {
          console.log(
            "Received track in registerPeerConnection:",
            event.streams[0]
          );
          const [remoteStream] = event.streams;
          setRemoteStreams((prev) => ({
            ...prev,
            [participant.userId]: remoteStream,
          }));
        };

        // console.log("peerConnection", peerConnection);

        // print(peerConnection);

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            // console.log("ICE candidate:", event.candidate);
            const candidateRef = push(
              ref(
                rtdb,
                `group-calls/${callId}/candidates/${user.userId}_${participant.userId}`
              )
            );
            set(candidateRef, event.candidate.toJSON());
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          console.log(
            "oniceconnectionstatechange",
            peerConnection.iceConnectionState
          );
        };

        const offerDescription = await peerConnection.createOffer();
        peerConnection.setLocalDescription(offerDescription);

        await set(
          ref(
            rtdb,
            `group-calls/${callId}/offers/${user.userId}_${participant.userId}`
          ),
          {
            type: offerDescription.type,
            sdp: offerDescription.sdp,
          }
        );

        // listen answer
        // onValue(
        //   ref(rtdb, `group-calls/${callId}/answers`),
        //   async (snapshot) => {
        //     const answers = snapshot.val() || {};
        //     for (const [key, answer] of Object.entries(answers)) {
        //       const [from, to] = key.split("_");
        //       if (from === user.userId && to === participant.userId) {
        //         if (!peerConnection.remoteDescription) {
        //           const answerDescription = new RTCSessionDescription(answer);
        //           await peerConnection.setRemoteDescription(answerDescription);
        //         }
        //       }
        //     }
        //   }
        // );

        // Inside registerPeerConnection function
        onValue(
          ref(
            rtdb,
            `group-calls/${callId}/answers/${user.userId}_${participant.userId}`
          ),
          async (snapshot) => {
            console.log(
              `[Answer] Listening for answer from ${participant.userId}`
            );
            const answer = snapshot.val();
            if (answer && !peerConnection.remoteDescription) {
              try {
                console.log(
                  `[Answer] Setting remote description from ${participant.userId}`
                );
                const answerDescription = new RTCSessionDescription(answer);
                await peerConnection.setRemoteDescription(answerDescription);
                console.log(
                  `[Answer] Successfully set remote description from ${participant.userId}`
                );
              } catch (error) {
                console.error(
                  `[Answer] Error setting remote description from ${participant.userId}:`,
                  error
                );
              }
            }
          }
        );

        // onValue(
        //   ref(rtdb, `group-calls/${callId}/candidates`),
        //   async (snapshot) => {
        //     const candidates = snapshot.val() || {};

        //     for (const [key, candidate] of Object.entries(candidates)) {
        //       const [from, to] = key.split("_");

        //       if (from === participant.userId && to === user.userId) {
        //         // Kiểm tra xem remote description đã được thiết lập chưa
        //         try {
        //           await peerConnection.addIceCandidate(candidate);
        //           // console.log("ICE candidate added:", candidate, from, to);
        //         } catch (error) {
        //           console.error("Error adding ICE candidate:", error);
        //         }
        //       }
        //     }
        //   }
        // );

        onValue(
          ref(
            rtdb,
            `group-calls/${callId}/candidates/${participant.userId}_${user.userId}`
          ),
          async (snapshot) => {
            if (!snapshot.exists()) return;

            const candidates = snapshot.val();
            // Iterate through all candidates in the snapshot
            for (const [key, candidateData] of Object.entries(candidates)) {
              try {
                // console.log(
                //   `Adding ICE candidate ${key} from ${participant.userId}`
                // );
                // console.log("candidate data:", candidateData);

                // Create new RTCIceCandidate from the candidate data
                const candidate = new RTCIceCandidate(candidateData);
                await peerConnection.addIceCandidate(candidate);
                // console.log(`Successfully added ICE candidate ${key}`);
              } catch (error) {
                console.error(
                  `Error adding ICE candidate from ${participant.userId}:`,
                  error
                );
              }
            }
          }
        );

        // setPeerConnections((prev) => ({
        //   ...prev,
        //   [participant.userId]: peerConnection,
        // }));
        peerConnections.current[participant.userId] = peerConnection;
      }
    } catch (error) {
      console.error("Error in registerPeerConnection:", error);
      endCall();
    }
  };

  const joinCall = async (callId) => {
    try {
      setIsCalling(true);

      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      // console.log("hung");

      await registerPeerConnection(callId, stream);

      // Add self to participants
      await set(
        ref(rtdb, `group-calls/${callId}/participants/${user.userId}`),
        {
          userId: user.userId,
          joinedAt: new Date().toISOString(),
        }
      );

      await listenPeerConnections(callId, stream);
    } catch (error) {
      console.error("Error in joinCall:", error);
      endCall();
    }
  };

  // Modify endCall and cleanupCall to handle multiple connections
  const cleanupCall = async () => {
    try {
      // if (peerConnections) {
      //   Object.keys(peerConnections).forEach((peerConnectionKey) => {
      //     peerConnections[peerConnectionKey].close();
      //   });
      // }

      if (peerConnections.current) {
        Object.values(peerConnections.current).forEach((connection) => {
          if (connection) {
            connection.close();
          }
        });
        peerConnections.current = {};
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      if (remoteStreams) {
        Object.keys(remoteStreams).forEach((remoteStreamKey) => {
          remoteStreams[remoteStreamKey]
            .getTracks()
            .forEach((track) => track.stop());
        });
      }

      setRemoteStreams({});
      // setPeerConnections({});
      setIsInitiator(false);
      setIsCalling(false);
      setCallData(null);
      setParticipants([]);
    } catch (error) {
      console.error("Error in cleanupCall:", error);
    }
  };

  const handleIncomingCall = (callId, callerData) => {
    setIncomingCall(true);
    setCallData({ callId, remoteUser: callerData });
    // console.log(callData);
    router.push("/home/group-call-screen");
  };

  const endCall = async () => {
    try {
      if (callData) {
        await remove(ref(rtdb, `group-calls/${callData.callId}`));
      }

      cleanupCall();
      router.back();
    } catch (error) {
      console.error("Error in endCall:", error);
    }
  };

  const acceptCall = async () => {
    try {
      if (!callData?.callId) {
        console.error("No call data available");
        return;
      }

      setIncomingCall(false);
      await joinCall(callData.callId);
    } catch (error) {
      console.error("Error in acceptCall:", error);
      endCall();
    }
  };

  const rejectCall = async () => {
    try {
      setIncomingCall(false);
      setCallData(null);
      router.back();
    } catch (error) {
      console.error("Error in rejectCall:", error);
    }
  };

  return (
    <GroupCallContext.Provider
      value={{
        localStream,
        remoteStreams,
        isCalling,
        isInitiator,
        participants,
        startCall,
        joinCall,
        endCall,
        acceptCall,
        rejectCall,
        incomingCall,
      }}
    >
      {children}
    </GroupCallContext.Provider>
  );
}

export const useGroupCall = () => useContext(GroupCallContext);
