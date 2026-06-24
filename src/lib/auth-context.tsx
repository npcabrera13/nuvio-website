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
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

interface UserProfile {
  uid: string;
  email: string | null;
  username: string | null;
  stremioToken: string;
  status: "active" | "expired";
  expiresAt: Timestamp | null;
  createdAt: Timestamp | null;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<{ needsVerification: boolean }>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Generate a random Nuvio token: nuvio_ + 8 alphanumeric chars */
function generateStremioToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return (
    "nuvio_" +
    Array.from({ length: 8 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("")
  );
}

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
          username: data.username ?? null,
          stremioToken: data.stremioToken ?? "",
          status: data.status ?? "active",
          expiresAt: data.expiresAt ?? null,
          createdAt: data.createdAt ?? null,
          emailVerified: data.emailVerified ?? false,
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

  const createCustomerDocs = useCallback(
    async (firebaseUser: User, username: string) => {
      const token = generateStremioToken();
      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // customers/{uid} — user's private profile
      await setDoc(doc(db, "customers", firebaseUser.uid), {
        email: firebaseUser.email,
        username,
        stremioToken: token,
        status: "active",
        expiresAt: Timestamp.fromDate(expires),
        createdAt: serverTimestamp(),
        emailVerified: false,
      });

      // tokens/{token} — public doc for Stremio API validation
      await setDoc(doc(db, "tokens", token), {
        uid: firebaseUser.uid,
        status: "active",
        expiresAt: Timestamp.fromDate(expires),
      });

      return token;
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string, username: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      await createCustomerDocs(cred.user, username);
      // Send custom verification email via our API route
      const res = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cred.user.email,
          uid: cred.user.uid,
          username,
        }),
      });
      const data = await res.json();
      // Store the verification token in Firestore so /api/verify-email can find it
      if (data.token) {
        await setDoc(doc(db, "verifications", data.token), {
          uid: cred.user.uid,
          email: cred.user.email,
          expiresAt: Timestamp.fromDate(new Date(data.expiresAt)),
          used: false,
        });
      }
      return { needsVerification: true };
    },
    [createCustomerDocs]
  );

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    // Check if profile exists; if not (first Google sign-in), create docs
    const snap = await getDoc(doc(db, "customers", cred.user.uid));
    if (!snap.exists()) {
      await createCustomerDocs(cred.user, cred.user.displayName ?? "Nuvio User");
      // Google emails are pre-verified by Google — mark as verified
      await setDoc(
        doc(db, "customers", cred.user.uid),
        { emailVerified: true },
        { merge: true }
      );
      return { needsVerification: false };
    }
    return { needsVerification: !snap.data()?.emailVerified };
  }, [createCustomerDocs]);

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
