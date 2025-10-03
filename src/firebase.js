import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";         
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyDCvKa_YxP4DUZpYSykY41yG1Qx2yTY46I",
  authDomain: "prepvault-151105.firebaseapp.com",
  projectId: "prepvault-151105",
  storageBucket: "prepvault-151105.firebasestorage.app",
  messagingSenderId: "956363286854",
  appId: "1:956363286854:web:3e80b5d12b3b7aa774dd47",
  measurementId: "G-E6KZY31SC8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);        
const db = getFirestore(app);     

export { auth, db };              
