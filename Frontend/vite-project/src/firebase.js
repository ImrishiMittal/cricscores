import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6JqsVOCuvYx0KXpC5zWulV4wkz-NGo8I",
  authDomain: "cricscorers-8873e.firebaseapp.com",
  projectId: "cricscorers-8873e",
  storageBucket: "cricscorers-8873e.firebasestorage.app",
  messagingSenderId: "224422088031",
  appId: "1:224422088031:web:db6ae6f606823170eb7aea",
  measurementId: "G-JFX0XL8DMZ",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
