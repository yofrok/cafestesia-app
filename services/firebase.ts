
import { initializeApp } from 'firebase/app';
// FIX: Use named imports for modular SDK
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6-Z_XRfCHWQ3ujGzkj4ck1WtI9gX6O_k",
  authDomain: "cafestesiaapp.firebaseapp.com",
  projectId: "cafestesiaapp",
  storageBucket: "cafestesiaapp.firebasestorage.app",
  messagingSenderId: "639191492553",
  appId: "1:639191492553:web:dc6ce00f5622dc686faa18",
  measurementId: "G-Z52JP10C1R"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service using the v9 modular API
export const db = getFirestore(app);
