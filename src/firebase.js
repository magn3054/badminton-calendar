// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBTKsVon-ITAPA0Z2uUfvqwFsQDyi7F5o",
  authDomain: "badminton-schedular.firebaseapp.com",
  projectId: "badminton-schedular",
  storageBucket: "badminton-schedular.firebasestorage.app",
  messagingSenderId: "477694027302",
  appId: "1:477694027302:web:eb649e5562e724e590e8e7",
  measurementId: "G-9R5Y4F8PM8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in the app
export { auth, db };
