import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWMV1pDM0pNrOmtsNkan-tOKx0d2LrIRM",
  authDomain: "serup-progress-tracker.firebaseapp.com",
  projectId: "serup-progress-tracker",
  storageBucket: "serup-progress-tracker.firebasestorage.app",
  messagingSenderId: "502696717817",
  appId: "1:502696717817:web:906487e6781ee072b6a128"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export { doc, getDoc, setDoc };