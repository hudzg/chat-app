import { db } from "../firebaseConfig";
import { 
  collection, 
  addDoc, 
  Timestamp, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  orderBy,
  onSnapshot 
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
    throw error;
  }
};

export const addMemberToGroup = async (groupId, userId) => {
  try {
    const groupRef = collection(db, "groups");
    const q = query(groupRef, where("id", "==", groupId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const groupDoc = querySnapshot.docs[0];
      await updateDoc(groupDoc.ref, {
        members: arrayUnion(userId)
      });
    }
  } catch (error) {
    throw error;
  }
};

export const removeMemberFromGroup = async (groupId, userId) => {
  try {
    const groupRef = collection(db, "groups");
    const q = query(groupRef, where("id", "==", groupId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const groupDoc = querySnapshot.docs[0];
      await updateDoc(groupDoc.ref, {
        members: arrayRemove(userId)
      });
    }
  } catch (error) {
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
    throw error;
  }
};