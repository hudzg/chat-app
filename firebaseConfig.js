// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6p_exHQMQ3w_XqLjO_KcjwHLDZAu0vDU",
  authDomain: "chat-app-ec5a7.firebaseapp.com",
  projectId: "chat-app-ec5a7",
  storageBucket: "chat-app-ec5a7.firebasestorage.app",
  messagingSenderId: "765039887636",
  appId: "1:765039887636:web:1a212269e33289db84ae01",
  measurementId: "G-YCFZ5ZF2VZ",
  databaseURL:
    "https://chat-app-ec5a7-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export const usersRef = collection(db, "users");
export const roomsRef = collection(db, "rooms");
