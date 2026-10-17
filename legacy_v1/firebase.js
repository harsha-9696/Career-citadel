import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "career-mirror-abc8b.firebaseapp.com",
  projectId: "career-mirror-abc8b",
  storageBucket: "career-mirror-abc8b.firebasestorage.app",
  messagingSenderId: "493911894573",
  appId: "1:493911894573:web:aca3fd6ee596cab308e6a4",
  measurementId: "G-ZJ4658CS5N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function logout() {
  return await signOut(auth);
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function saveAnalysis(uid, data) {
  return await addDoc(collection(db, "users", uid, "analyses"), {
    ...data,
    createdAt: new Date().toISOString()
  });
}

export async function getAnalyses(uid) {
  const q = query(collection(db, "users", uid, "analyses"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveProfile(uid, data) {
  await setDoc(doc(db, "users", uid, "profile", "data"), data, { merge: true });
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid, "profile", "data"));
  return snap.exists() ? snap.data() : null;
}