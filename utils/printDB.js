import { collection, getDocs, getFirestore, getCollections } from "firebase/firestore";
import { db } from "../firebaseConfig"; // đường dẫn đến file firebase.js

export const printDatabase = async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, doc.data());
  });
};
