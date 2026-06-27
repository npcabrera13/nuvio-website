"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * If the user is already logged in AND has an assigned token,
 * bounce them straight to /dashboard so they don't see the landing page again.
 *
 * Firebase Auth persists sessions via localStorage/IndexedDB by default,
 * so this works across page reloads and when returning to the site later.
 */
export function AutoLoginRedirect() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // Only redirect if we actually have a Firebase user AND a profile with a token.
    // Visitors who are not logged in see the landing page normally.
    if (user && profile?.tokenId && profile.status !== "pending") {
      router.replace("/dashboard");
    }
  }, [user, profile, loading, router]);

  return null;
}
