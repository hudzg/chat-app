// Import the functions you need from the SDKs you need
import { initializeApp } from "@react-native-firebase/app";
import { getMessaging, getToken } from "@react-native-firebase/messaging";
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

export const messaging = getMessaging(app);
