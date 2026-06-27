/**
 * Firebase Client SDK initialization.
 * Used in client components for Auth (email/password + Google) + Firestore reads.
 *
 * Auth persistence: set to LOCAL (default) — the user's session survives
 * across browser restarts via IndexedDB. This means:
 *   - User signs up → closes browser → reopens → still logged in
 *   - User clicks verification link in same browser → still logged in →
 *     verify page redirects straight to dashboard
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4OXdfVs_mXPinhmpAt2su8WKZhUDXWoQ",
  authDomain: "multiaddon.firebaseapp.com",
  projectId: "multiaddon",
  storageBucket: "multiaddon.firebasestorage.app",
  messagingSenderId: "963978475190",
  appId: "1:963978475190:web:6796687180b021e049d817",
};

// Avoid duplicate init in dev hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Explicitly set local persistence (survives browser restarts)
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Failed to set auth persistence:", err);
});

export const db = getFirestore(app);
export { app };
