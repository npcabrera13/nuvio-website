"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * If the user is already logged in AND has a token assigned,
 * bounce them straight to /dashboard so they don't see the landing page again.
 *
 * Users who are logged in but have NO token (signed up, haven't verified email
 * yet) are NOT redirected — they stay on the landing page.
 */
export function AutoLoginRedirect() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // Only redirect if we have a user AND a profile with a token.
    if (user && profile?.tokenId && profile.nuvioEmail) {
      router.replace("/dashboard");
    }
  }, [user, profile, loading, router]);

  return null;
}
