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
  profileLoading: boolean;
  signup: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ needsVerification: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Assigns a Nuvio account to the current user. Called after email verification. */
  completeVerification: (skipTrial?: boolean) => Promise<void>;
  /** Assigns a token after payment (for users who didn't get a free trial). */
  assignTokenAfterPayment: () => Promise<void>;
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
  userEmail: string | null,
  trialDays: number = 7
): Promise<string> => {
  // 1. Find an available token.
  //    The admin panel creates tokens with status: "active" and assignedTo: null.
  //    So "available" = status is "active" AND assignedTo is null/empty.
  //    We query by status, then filter client-side for assignedTo.
  const q = query(
    collection(db, "customers"),
    where("status", "==", "active"),
    limit(10)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error(ACCOUNTS_FULL_ERROR);
  }

  // Find the first token that's NOT assigned to anyone AND has Nuvio credentials
  let tokenDoc = null;
  let tokenData = null;
  for (const doc_snap of snapshot.docs) {
    const data = doc_snap.data();
    const assignedTo = data.assignedTo;
    const hasCredentials = data.nuvioEmail && data.nuvioEmail.trim() !== "";
    // Available = assignedTo is null/empty AND has Nuvio credentials set by admin
    if ((!assignedTo || assignedTo === "" || assignedTo === null) && hasCredentials) {
      tokenDoc = doc_snap;
      tokenData = data;
      break;
    }
  }

  if (!tokenDoc || !tokenData) {
    throw new Error(ACCOUNTS_FULL_ERROR);
  }

  const tokenId = tokenDoc.id;

  const now = new Date();
  const expires = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  // 2. Update the token doc with the user's info (1 write).
  //    Set assignedTo to the user's EMAIL (not UID) so the admin panel
  //    can display who the account belongs to (shows first 8 chars).
  //    The 7-day expiry OVERWRITES whatever the admin set — the free trial
  //    is always 7 days from verification, regardless of admin's placeholder.
  await updateDoc(doc(db, "customers", tokenId), {
    name: userEmail ?? "",
    assignedTo: userEmail ?? "",
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
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
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
    } finally {
      setProfileLoading(false);
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
   * If skipTrial is true (user already used their free trial), don't assign
   * a token — set displayName to "verified-no-trial" so the dashboard knows
   * to show the "pay to get access" screen instead of "verify your email".
   */
  const completeVerification = useCallback(async (skipTrial: boolean = false) => {
    if (!user) throw new Error("Must be logged in to complete verification");
    if (!skipTrial) {
      await assignTokenToUser(user, user.email);
    } else {
      // Mark as verified but no trial — dashboard shows "pay to get access"
      await updateProfile(user, { displayName: "verified-no-trial" });
    }
    await fetchProfile(user);
  }, [user, fetchProfile]);

  /**
   * Assign a token to the current user after payment.
   * Called from the dashboard when payment succeeds and the user has no token.
   * @param days - number of days to set as the expiry (from the plan they bought)
   */
  const assignTokenAfterPayment = useCallback(async (days: number = 30) => {
    if (!user) throw new Error("Must be logged in");
    await assignTokenToUser(user, user.email, days);
    await fetchProfile(user);
  }, [user, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    // Check if user already has a valid token (displayName starts with "nuvio_")
    // Google sets displayName to the user's real name, so we can't just check if it's null
    const hasToken = cred.user.displayName && cred.user.displayName.startsWith("nuvio_");

    if (!hasToken) {
      // No valid token — assign one (Google emails are pre-verified)
      try {
        await assignTokenToUser(cred.user, cred.user.email);
      } catch (err) {
        // If accounts are full, they'll see the pay screen
        console.error("Failed to assign token for Google user:", err);
      }
    }

    return { needsVerification: false };
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, profileLoading, signup, login, loginWithGoogle, signOut, refreshProfile, completeVerification, assignTokenAfterPayment }}
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
// cache bust 1782707666
