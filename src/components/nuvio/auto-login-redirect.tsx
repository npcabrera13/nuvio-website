"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * If the user is already logged in AND email-verified (or admin),
 * bounce them straight to /dashboard so they don't see the landing page again.
 * Runs once on mount; safe on Cloudflare static export because it's pure client-side.
 */
export function AutoLoginRedirect() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // Only redirect if we actually have a Firebase user AND a profile with a token.
    // Visitors who are not logged in see the landing page normally.
    if (user && profile?.stremioToken) {
      router.replace("/dashboard");
    }
  }, [user, profile, loading, router]);

  return null;
}
