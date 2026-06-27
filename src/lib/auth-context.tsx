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
  status: "available" | "active" | "expired";
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
  /** Assigns a Nuvio account to the current user. Called after email verification. */
  completeVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * ARCHITECTURE — accounts only given to VERIFIED users (no wasted accounts):
 *
 *   customers/{tokenId} = {
 *     nuvioEmail: "...",      ← set by admin
 *     nuvioPassword: "...",
 *     name: "user@email.com", ← set on verification (empty = available)
 *     notes: "",
 *     status: "available" | "active" | "expired",
 *     expiresAt: timestamp,
 *     createdAt: timestamp
 *   }
 *
 * FLOW:
 * - Admin creates token docs with status "available" + Nuvio credentials.
 * - Signup: create Firebase Auth user + send verification email (0 Firestore!).
 * - User clicks email link → /verify page → completeVerification():
 *   1. Query available token (1 read)
 *   2. Update token: name + status="active" + 7-day expiry (1 write)
 *   3. Store tokenId in user.displayName (0 Firestore)
 * - Dashboard reads customers/{user.displayName} → 1 read.
 * - Verification uses signed JWT (HMAC) → 0 Firestore.
 *
 * BENEFIT: Nuvio accounts are NEVER held for unverified users.
 * If someone signs up with a fake email, zero accounts wasted.
 */

const assignTokenToUser = async (
  firebaseUser: User,
  userEmail: string | null
): Promise<string> => {
  // 1. Find an available token — status must be "available" AND name must be empty.
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

  // Safety check: if this token somehow already has a user assigned, skip it.
  if (tokenData.name && tokenData.name.trim() !== "") {
    throw new Error(ACCOUNTS_FULL_ERROR);
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day trial

  // 2. Update the token doc with the user's info (1 write).
  //    The 7-day expiry OVERWRITES whatever the admin set — the free trial
  //    is always 7 days from verification, regardless of admin's placeholder.
  await updateDoc(doc(db, "customers", tokenId), {
    name: userEmail ?? "",
    status: "active",
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
      // Create Firebase Auth user — NO Firestore writes, NO token assigned yet.
      // The Nuvio account will only be assigned when they verify their email.
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      if (isAdmin) {
        // Admin: assign token immediately, skip email verification
        await assignTokenToUser(cred.user, cred.user.email);
        return { needsVerification: false };
      }

      // Regular user: send verification email (no token assigned)
      try {
        await fetch("/api/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cred.user.email,
            uid: cred.user.uid,
          }),
        });
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
      return { needsVerification: true };
    },
    []
  );

  /**
   * Called from the /verify page AFTER the email link is clicked.
   * This is where the Nuvio account actually gets assigned.
   */
  const completeVerification = useCallback(async () => {
    if (!user) throw new Error("Must be logged in to complete verification");
    await assignTokenToUser(user, user.email);
    await fetchProfile(user);
  }, [user, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    // New Google user (no displayName = no token assigned yet)
    // Google emails are pre-verified by Google, so assign immediately
    if (!cred.user.displayName) {
      await assignTokenToUser(cred.user, cred.user.email);
      return { needsVerification: false };
    }

    // Existing user — fetchProfile will read their token
    return { needsVerification: false };
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signup, login, loginWithGoogle, signOut, refreshProfile, completeVerification }}
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
