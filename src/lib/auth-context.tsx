"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

/** Admin emails — bypass email verification (go straight to dashboard) */
const ADMIN_EMAILS = [
  "neilpaolocabrera@gmail.com",
  "gensnapdragon5@gmail.com",
].map((e) => e.toLowerCase());

/** Error thrown when no tokens are available to assign */
export const ACCOUNTS_FULL_ERROR = "ACCOUNTS_FULL";

interface UserProfile {
  uid: string;
  email: string | null;
  stremioToken: string;
  nuvioEmail: string;
  nuvioPassword: string;
  status: "active" | "expired";
  expiresAt: Timestamp | null;
  createdAt: Timestamp | null;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Find an available token in the `tokens` collection and assign it to the user.
 *
 * The admin pre-creates token docs (via the admin panel) with real Nuvio.tv
 * credentials. Each token doc looks like:
 *   tokens/{tokenId} = {
 *     nuvioEmail: "user@nuvio.tv",
 *     nuvioPassword: "pass123",
 *     status: "available" | "assigned",
 *     assignedTo: uid | null,
 *     createdAt: timestamp
 *   }
 *
 * This function:
 *   1. Queries for a token where status == "available"
 *   2. If none found → throws ACCOUNTS_FULL_ERROR
 *   3. Creates customers/{uid} with the token's Nuvio credentials
 *   4. Marks the token as assigned to this user
 */
const assignTokenToUser = async (
  firebaseUser: User,
  emailVerified: boolean
): Promise<string> => {
  // 1. Find an available token
  const q = query(
    collection(db, "tokens"),
    where("status", "==", "available"),
    limit(1)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error(ACCOUNTS_FULL_ERROR);
  }

  const tokenDoc = snapshot.docs[0];
  const tokenData = tokenDoc.data();
  const tokenId = tokenDoc.id;

  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day trial

  // 2. Create the customer doc with the token's Nuvio credentials
  await setDoc(doc(db, "customers", firebaseUser.uid), {
    email: firebaseUser.email,
    stremioToken: tokenId,
    nuvioEmail: tokenData.nuvioEmail || "",
    nuvioPassword: tokenData.nuvioPassword || "",
    status: "active",
    expiresAt: Timestamp.fromDate(expires),
    createdAt: serverTimestamp(),
    emailVerified,
  });

  // 3. Mark the token as assigned to this user
  await updateDoc(doc(db, "tokens", tokenId), {
    status: "assigned",
    assignedTo: firebaseUser.uid,
    assignedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expires),
  });

  return tokenId;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string, email: string | null) => {
    try {
      const ref = doc(db, "customers", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          uid,
          email: data.email ?? email,
          stremioToken: data.stremioToken ?? "",
          nuvioEmail: data.nuvioEmail ?? "",
          nuvioPassword: data.nuvioPassword ?? "",
          status: data.status ?? "active",
          expiresAt: data.expiresAt ?? null,
          createdAt: data.createdAt ?? null,
          emailVerified: data.emailVerified ?? false,
        });
      } else {
        // User exists in Firebase Auth but has no customer doc.
        // This can happen if signup failed midway (e.g. token assignment
        // threw ACCOUNTS_FULL). Don't auto-create — just set profile to
        // null so the dashboard can show the appropriate screen.
        setProfile(null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid, firebaseUser.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.uid, user.email);
  }, [user, fetchProfile]);

  const signup = useCallback(
    async (email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      if (isAdmin) {
        // Admin: assign token + auto-verify, skip email flow
        await assignTokenToUser(cred.user, true);
        return { needsVerification: false };
      }

      // Regular user: assign token, then send verification email
      await assignTokenToUser(cred.user, false);
      try {
        const res = await fetch("/api/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cred.user.email,
            uid: cred.user.uid,
          }),
        });
        const data = await res.json();
        if (data.token) {
          await setDoc(doc(db, "verifications", data.token), {
            uid: cred.user.uid,
            email: cred.user.email,
            expiresAt: Timestamp.fromDate(new Date(data.expiresAt)),
            used: false,
          });
        }
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
      return { needsVerification: true };
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, "customers", cred.user.uid));
    if (!snap.exists()) {
      // New Google user — assign a token (Google emails are pre-verified)
      await assignTokenToUser(cred.user, true);
      return { needsVerification: false };
    }
    return { needsVerification: !snap.data()?.emailVerified };
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signup, login, loginWithGoogle, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
