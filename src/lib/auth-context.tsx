"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
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
  tokenId: string;
  nuvioEmail: string;
  nuvioPassword: string;
  status: "available" | "pending" | "active" | "expired";
  expiresAt: Timestamp | null;
  createdAt: Timestamp | null;
  name: string;
  notes: string;
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
 * ARCHITECTURE (single collection, minimal reads/writes):
 *
 *   customers/{tokenId} = {
 *     nuvioEmail: "...",      ← real Nuvio.tv credentials (set by admin)
 *     nuvioPassword: "...",
 *     name: "user@email.com", ← assigned user's email (empty = available)
 *     notes: "",
 *     status: "available" | "pending" | "active" | "expired",
 *     expiresAt: timestamp,
 *     createdAt: timestamp
 *   }
 *
 * - Admin creates token docs with status "available" + Nuvio credentials.
 * - Signup: query 1 available token → update it (1 read + 1 write).
 * - Token ID stored in user.displayName (Firebase Auth) → 0 Firestore.
 * - Dashboard reads customers/{user.displayName} → 1 read.
 * - Verification uses signed JWT (HMAC) → 0 Firestore reads/writes.
 * - On verify: update customers/{tokenId}.status = "active" → 1 write.
 *
 * Total per user: ~2 reads + 2 writes. No tokens/ or verifications/ collections.
 */

const assignTokenToUser = async (
  firebaseUser: User,
  userEmail: string | null,
  initialStatus: "pending" | "active"
): Promise<string> => {
  // 1. Find an available token (1 read)
  const q = query(
    collection(db, "customers"),
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

  // 2. Update the token doc with the user's info (1 write)
  await updateDoc(doc(db, "customers", tokenId), {
    name: userEmail ?? "",
    status: initialStatus,
    expiresAt: Timestamp.fromDate(expires),
  });

  // 3. Store tokenId in user.displayName (Firebase Auth, 0 Firestore)
  await updateProfile(firebaseUser, { displayName: tokenId });

  return tokenId;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    // Read customers/{user.displayName} — 1 read, no queries
    const tokenId = firebaseUser.displayName;
    if (!tokenId) {
      setProfile(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, "customers", tokenId));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          tokenId,
          nuvioEmail: data.nuvioEmail ?? "",
          nuvioPassword: data.nuvioPassword ?? "",
          status: data.status ?? "available",
          expiresAt: data.expiresAt ?? null,
          createdAt: data.createdAt ?? null,
          name: data.name ?? "",
          notes: data.notes ?? "",
        });
      } else {
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
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  const signup = useCallback(
    async (email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      if (isAdmin) {
        // Admin: assign token + set status active immediately, skip email
        await assignTokenToUser(cred.user, cred.user.email, "active");
        return { needsVerification: false };
      }

      // Regular user: assign token with "pending" status, send verification email
      await assignTokenToUser(cred.user, cred.user.email, "pending");
      try {
        await fetch("/api/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cred.user.email,
            uid: cred.user.uid,
            tokenId: cred.user.displayName, // the assigned token ID
          }),
        });
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

    // New Google user (no displayName = no token assigned yet)
    if (!cred.user.displayName) {
      await assignTokenToUser(cred.user, cred.user.email, "active");
      return { needsVerification: false };
    }

    // Existing user — fetchProfile (triggered by onAuthStateChanged) will
    // read the status. Don't do a duplicate read here. Assume active;
    // the dashboard will show the "verify" gate if status is pending.
    return { needsVerification: false };
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
