"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * If the user is already logged in (Firebase Auth session persists via
 * localStorage/IndexedDB), bounce them straight to /dashboard.
 *
 * Firebase Auth restores the session on page load, so this works when:
 * - User signed up, closed the tab, and came back later
 * - User clicks the site URL while already logged in
 * - User navigates to / after logging in
 */
export function AutoLoginRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // If we have a Firebase Auth user, send them to the dashboard.
    // The dashboard handles all the states (verified, unverified, no token).
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return null;
}
