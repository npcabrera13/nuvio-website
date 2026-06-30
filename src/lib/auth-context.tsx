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
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
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
  assignTokenAfterPayment: (days?: number) => Promise<void>;
  /** Sends a password reset email */
  resetPassword: (email: string) => Promise<void>;
  /** Resends the verification email */
  resendVerificationEmail: () => Promise<void>;
  /** Redeems a promo code and assigns a token */
  redeemPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
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
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (firebaseUser: User) => {
    setIsProfileLoading(true);
    // Reload user to get latest emailVerified status
    try { await reload(firebaseUser); } catch {}

    const userEmail = firebaseUser.email?.toLowerCase();
    if (!userEmail) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    try {
      const tokenId = firebaseUser.displayName;
      let snap = null;
      let tokenIdToLoad = null;

      // 1. Try the saved link (displayName) first — fast path, 1 read.
      if (tokenId && tokenId !== "verified-no-trial") {
        snap = await getDoc(doc(db, "customers", tokenId));
        if (snap.exists()) {
          const data = snap.data();
          const assignedTo = data.assignedTo;
          // SECURITY: only use this token if it's still assigned to THIS user.
          // If admin unassigned/reassigned → the saved link is stale; fall through
          // to the email search below.
          if (!assignedTo || assignedTo.trim() === "" || assignedTo.toLowerCase() !== userEmail) {
            snap = null; // stale link, discard
          } else {
            tokenIdToLoad = tokenId;
          }
        } else {
          snap = null; // token doc deleted
        }
      }

      // 2. FALLBACK: search for a token assigned to this email.
      //    Covers:
      //      - Admin pre-assign to a user who hasn't signed up yet (no displayName yet)
      //      - Admin reassign to a new token (displayName still points to old one)
      //      - Saved link was stale (unassigned/reassigned/deleted)
      //    1 extra read only in these cases. Normal returning users skip this.
      if (!snap) {
        const q = query(
          collection(db, "customers"),
          where("assignedTo", "==", userEmail),
          limit(1)
        );
        const qsnap = await getDocs(q);
        if (!qsnap.empty) {
          const foundDoc = qsnap.docs[0];
          // Only accept active, non-expired tokens.
          const data = foundDoc.data();
          const isBlocked = (data.status || "active") !== "active";
          let isExpired = false;
          if (data.expiresAt) {
            const expMillis = typeof data.expiresAt.toMillis === "function"
              ? data.expiresAt.toMillis()
              : data.expiresAt.seconds
                ? data.expiresAt.seconds * 1000
                : new Date(data.expiresAt).getTime();
            isExpired = Date.now() > expMillis;
          }
          if (!isBlocked) {
            snap = foundDoc;
            tokenIdToLoad = foundDoc.id;
            // One-time link: update displayName so future logins skip the search.
            try {
              await updateProfile(firebaseUser, { displayName: foundDoc.id });
            } catch (err) {
              console.error("Failed to update displayName:", err);
            }
            // Even if expired, we want the profile to load so the dashboard can
            // show the "Reactivate" screen (renew flow) instead of "Choose a Plan".
          }
        }
      }

      // 3. Load the profile (or null if no token belongs to this user).
      if (snap && snap.exists() && tokenIdToLoad) {
        const data = snap.data();
        setProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          tokenId: tokenIdToLoad,
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
      setIsProfileLoading(false);
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
        await assignTokenToUser(cred.user, cred.user.email);
        return { needsVerification: false };
      }

      // Regular user: send BOTH emails
      // 1. Firebase verification (sets emailVerified flag, provides redirect)
      try {
        const continueUrl = typeof window !== "undefined"
          ? `${window.location.origin}/verify-callback`
          : "https://nuviotv.pages.dev/verify-callback";
        await sendEmailVerification(cred.user, {
          url: continueUrl,
          handleCodeInApp: false,
        });
      } catch (err) {
        console.error("Firebase verification email failed:", err);
      }

      // 2. Custom branded email (nice design via worker-mailer)
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
        console.error("Custom verification email failed:", err);
      }
      return { needsVerification: true };
    },
    []
  );

  /**
   * Called from /verify-callback AFTER the email link is clicked.
   * NEW: Does NOT assign a token. Just reloads the user so emailVerified is updated.
   * The user must pay or use a promo code to get an account.
   */
  const completeVerification = useCallback(async (skipTrial: boolean = false) => {
    if (!user) throw new Error("Must be logged in to complete verification");
    // Just reload — no token assignment. Dashboard shows "Choose a Plan".
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

  /**
   * Redeems a promo code via the server-side /api/redeem endpoint.
   * The endpoint atomically (Firestore transaction):
   *   1. Validates the code exists in promoCodes/{code}
   *   2. Rejects if this email already has an active subscription (anti-abuse)
   *   3. Finds an available Nuvio account
   *   4. Assigns it + sets expiry = now + promo.days + DELETES the code (single-use)
   * This replaces the old client-side logic that had a race condition and only
   * marked codes as "used" instead of deleting them.
   */
  const redeemPromoCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !user.email) throw new Error("Must be logged in");

    const codeUpper = code.trim().toUpperCase();

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeUpper, email: user.email }),
      });
      const data = await res.json();

      if (!data.ok) {
        // Map server error codes → user-friendly messages.
        const msg =
          data.error === "invalid"        ? "Promo code is invalid." :
          data.error === "no_accounts"    ? "All Nuvio accounts are currently taken. Please check back later." :
          data.error === "already_active" ? "You already have an active subscription." :
          data.error === "server"         ? "Server error. Please try again." :
          "Promo code is invalid.";
        return { success: false, message: msg };
      }

      // Refresh profile so the dashboard picks up the newly-assigned token.
      await fetchProfile(user);
      const days = data.days || 7;
      return { success: true, message: `Promo code redeemed! ${days} days added.` };
    } catch (err) {
      console.error("redeemPromoCode failed:", err);
      return { success: false, message: "Network error. Please try again." };
    }
  }, [user, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    // Per the new flow: Google sign-in does NOT auto-assign a token.
    // Google emails are considered verified, but the user still must
    // either BUY a plan or REDEEM a promo code on the "Choose Plan"
    // screen before a Nuvio account is assigned to them.
    // (Previously this auto-assigned a 7-day trial — that was a bug.)
    return { needsVerification: false };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!user) throw new Error("Must be logged in");
    await reload(user);
    if (user.emailVerified) {
      throw new Error("already-verified");
    }
    // Send Firebase verification
    try {
      const continueUrl = typeof window !== "undefined"
        ? `${window.location.origin}/verify-callback`
        : "https://nuviotv.pages.dev/verify-callback";
      await sendEmailVerification(user, {
        url: continueUrl,
        handleCodeInApp: false,
      });
    } catch (err) {
      console.error("Firebase email failed:", err);
    }
    // Also send custom branded email
    try {
      await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, uid: user.uid }),
      });
    } catch (err) {
      console.error("Custom email failed:", err);
    }
  }, [user]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, profileLoading: isProfileLoading, signup, login, loginWithGoogle, signOut, refreshProfile, completeVerification, assignTokenAfterPayment, resetPassword, resendVerificationEmail, redeemPromoCode }}
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
