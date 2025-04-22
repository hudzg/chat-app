import { db } from "../firebaseConfig";
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
} from "firebase/firestore";

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
    return { id: docRef.id, ...newGroup };
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};


export const deleteGroup = async (groupId) => {
  try {
    // Delete all messages 
    const messagesRef = collection(db, "groups", groupId, "messages");
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(db);
    
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the group document
    batch.delete(doc(db, "groups", groupId));
    
    await batch.commit();
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};

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
    throw error;
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
    throw error;
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
    const q = query(groupRef, where("id", "==", groupId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const groupDoc = querySnapshot.docs[0];
      await updateDoc(groupDoc.ref, {
        lastMessage: message
      });
    }
  } catch (error) {
    console.error("Error sending group message:", error);
    throw error;
  }
};