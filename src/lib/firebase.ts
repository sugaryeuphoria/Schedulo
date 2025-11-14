import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQlKzt8taF54uNiB3yFcg8disIHg9Zgr8",
  authDomain: "schedulo-df4aa.firebaseapp.com",
  projectId: "schedulo-df4aa",
  storageBucket: "schedulo-df4aa.firebasestorage.app",
  messagingSenderId: "430792888221",
  appId: "1:430792888221:web:781141fa818441d46fa974"
};

const app = initializeApp(firebaseConfig);
// Note: Not using Firebase Auth - using mock credentials instead
// export const auth = getAuth(app);
export const db = getFirestore(app);
