import { db, auth } from "../firebaseConfig";
import { 
  collection, 
  addDoc,
  doc,
  getDoc,
  writeBatch,
  Timestamp, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { uploadMediaAsync } from "../utils/common";


export const createGroup = async (groupData) => {
  try {
    const groupRef = collection(db, "groups");
    const newGroup = {
      ...groupData,
      createdAt: Timestamp.fromDate(new Date()),
      messages: [],
      lastMessage: null
    };
    const docRef = await addDoc(groupRef, newGroup);
    await updateDoc(docRef, {
      groupId: docRef.id
    });

    return { id: docRef.id, ...newGroup };
  } catch (error) {
    console.error("Error creating group:", error);
  }
};

// Delete all messages for me
export const deleteChat = async (groupId) => {
  try {
     
    const messagesRef = collection(db, "groups", groupId, "messages");
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(db);
    
    messagesSnapshot.docs.forEach(doc => {
      const messageData = doc.data();
      batch.update(doc.ref, {
        deletedFor: messageData.deletedFor 
          ? arrayUnion(auth.currentUser.uid)
          : [auth.currentUser.uid]
      });
    });
    
    const groupRef = doc(db, "groups", groupId);
    batch.update(groupRef, {
      deletedFor: arrayUnion(auth.currentUser.uid),
      [`deletedAt.${auth.currentUser.uid}`]: Timestamp.now()
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting group:", error);
  }
};

export const leaveGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (groupDoc.exists()) {
      const currentMembers = groupDoc.data().members;
      const updatedMembers = currentMembers.filter(memberId => memberId !== userId);
      
      const updateData = {
        members: updatedMembers
      };

      if(groupDoc.data().admin === userId && updatedMembers.length > 0) {
        updateData.admin = updatedMembers[0];
      }
      await updateDoc(groupRef, updateData);

    }

  } catch (error) {
    console.error("Error leaving group:", error);
  }
}

export const addMembersToGroup = async (groupId, newMembers) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (groupDoc.exists()) {
      const currentMembers = groupDoc.data().members;
      const updatedMembers = [...new Set([...currentMembers, ...newMembers])];
      
      await updateDoc(groupRef, {
        members: updatedMembers
      });
    }
  } catch (error) {
    console.error("Error adding members:", error);
  }
};

//groupId và membersID
export const removeMembersFromGroup = async (groupId, membersToRemove) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (groupDoc.exists()) {
      const currentMembers = groupDoc.data().members;
      const updatedMembers = currentMembers.filter(
        memberId => !membersToRemove.includes(memberId)
      );
      
      await updateDoc(groupRef, {
        members: updatedMembers
      });
    }
  } catch (error) {
    console.error("Error removing members:", error);
  }
};

export const sendGroupMessage = async (groupId, messageData) => {
  try {
    const messageRef = collection(db, "groups", groupId, "messages");
    const message = {
      ...messageData,
      createdAt: Timestamp.fromDate(new Date())
    };
    await addDoc(messageRef, message);
    
    // Update last message in group
    const groupRef = collection(db, "groups");
    const q = query(groupRef, where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const groupDoc = querySnapshot.docs[0];
      await updateDoc(groupDoc.ref, {
        lastMessage: {
          ...message
        }
      });
    }
  } catch (error) {
    console.error("Error sending group message:", error);
  }
};


export const deleteOneMessage = async (groupId, messageId, deleteForEveryone = false) => {
  try {
    const messageRef = doc(db, "groups", groupId, "messages", messageId);
    const messageDoc = await getDoc(messageRef);

    const messageData = messageDoc.data();
    if (!messageData) {
      throw new Error("Message not found");
    }
    
    if (deleteForEveryone) {
      await updateDoc(messageRef, {
        text: "This message was deleted",
        type: "deleted",
        deletedBy: auth.currentUser.uid,
        isDeletedForEveryone: true
      });
    } else {
      await updateDoc(messageRef, {
        deletedFor: messageData.deletedFor 
          ? arrayUnion(auth.currentUser.uid)
          : [auth.currentUser.uid]
      });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};

export const sendMedia = async (groupId, sender) => {
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

        const docRef = doc(db, "groups", groupId);
        const messageRef = collection(docRef, "messages");

        await addDoc(messageRef, {
          userId: sender,
          mediaUrl: downloadURL,
          mediaType: mediaType,
          createdAt: Timestamp.fromDate(new Date()),
          type: mediaType,
          text: "Sent a media",
        });

        console.log(`Uploaded ${mediaType} and saved to Firestore!`);
      }
    } catch (error) {
      console.error("Error uploading media: ", error);
      Alert.alert("Error", "Failed to upload media");
    }
  };