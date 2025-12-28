// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-iKQV2rcr80Cq2-UIK__A4tl7-btPJnU",
  authDomain: "ogrpg-mssmx.firebaseapp.com",
  projectId: "ogrpg-mssmx",
  storageBucket: "ogrpg-mssmx.firebasestorage.app",
  messagingSenderId: "277215914044",
  appId: "1:277215914044:web:b34e11c0dceb56da0fbb39"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);