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
} from "firebase/firestore";

/** Admin emails — bypass email verification (go straight to dashboard) */
const ADMIN_EMAILS = [
  "neilpaolocabrera@gmail.com",
  "gensnapdragon5@gmail.com",
].map((e) => e.toLowerCase());

interface UserProfile {
  uid: string;
  email: string | null;
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
  signup: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
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
          stremioToken: data.stremioToken ?? "",
          status: data.status ?? "active",
          expiresAt: data.expiresAt ?? null,
          createdAt: data.createdAt ?? null,
          emailVerified: data.emailVerified ?? false,
        });
      } else {
        // User exists in Firebase Auth but has no Firestore doc yet.
        // Auto-create one so the dashboard doesn't show an infinite spinner.
        try {
          const token = generateStremioToken();
          const now = new Date();
          const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          await setDoc(ref, {
            email,
            stremioToken: token,
            status: "active",
            expiresAt: Timestamp.fromDate(expires),
            createdAt: serverTimestamp(),
            emailVerified: true,
          });
          await setDoc(doc(db, "tokens", token), {
            uid,
            status: "active",
            expiresAt: Timestamp.fromDate(expires),
          });
          setProfile({
            uid,
            email,
            stremioToken: token,
            status: "active",
            expiresAt: Timestamp.fromDate(expires),
            createdAt: null,
            emailVerified: true,
          });
        } catch (createErr) {
          console.error("Failed to auto-create profile:", createErr);
          setProfile(null);
        }
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
    async (firebaseUser: User, emailVerified: boolean) => {
      const token = generateStremioToken();
      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // customers/{uid} — user's private profile
      await setDoc(doc(db, "customers", firebaseUser.uid), {
        email: firebaseUser.email,
        stremioToken: token,
        status: "active",
        expiresAt: Timestamp.fromDate(expires),
        createdAt: serverTimestamp(),
        emailVerified,
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
    async (email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

      if (isAdmin) {
        // Admin: auto-verify, skip email flow, go straight to dashboard
        await createCustomerDocs(cred.user, true);
        return { needsVerification: false };
      }

      // Regular user: create docs, send verification email
      await createCustomerDocs(cred.user, false);
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
    [createCustomerDocs]
  );

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, "customers", cred.user.uid));
    if (!snap.exists()) {
      // Google emails are pre-verified by Google
      await createCustomerDocs(cred.user, true);
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
