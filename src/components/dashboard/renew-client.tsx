"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Gift, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// ─── RenewalHero (embedded here for the /renew page) ───
const PLANS = [
  { id: "30", label: "30 Days", price: 49, days: 30, color: "from-violet-500 to-fuchsia-500", popular: true },
  { id: "7",  label: "7 Days",  price: 29, days: 7,  color: "from-pink-500 to-rose-500" },
  { id: "3",  label: "3 Days",  price: 19, days: 3,  color: "from-amber-500 to-orange-500" },
];

function RenewalHero({ isExpired, hasExistingToken }: { isExpired: boolean; hasExistingToken?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const plan = PLANS[selected];
  const router = useRouter();

  useEffect(() => {
    const handlePageShow = () => setPayLoading(false);
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-5">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/15 to-amber-500/10 animate-pulse-slow" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 animate-bounce-subtle">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-amber-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">
              {!hasExistingToken
                ? "Choose a Plan"
                : isExpired
                ? "Reactivate your account"
                : "Keep the magic going"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {!hasExistingToken
                ? "Pick a plan to get instant access to a Nuvio account"
                : isExpired
                ? "Renew now to unlock everything again"
                : "Don't lose access when your subscription ends"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {PLANS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(i)}
              className={`relative rounded-xl p-3 text-center transition-all duration-200 ${
                selected === i
                  ? `bg-gradient-to-br ${p.color} shadow-lg scale-105`
                  : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              {p.popular && (
                <span className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-bold ${
                  selected === i ? "bg-white text-violet-700" : "nuvio-gradient-bg text-white"
                }`}>
                  POPULAR
                </span>
              )}
              <p className={`text-[10px] font-semibold ${selected === i ? "text-white/80" : "text-muted-foreground"}`}>{p.label}</p>
              <p className={`text-xl font-extrabold ${selected === i ? "text-white" : "text-foreground"}`}>₱{p.price}</p>
            </button>
          ))}
        </div>

        <button
          onClick={async () => {
            setPayLoading(true);
            setPayError("");
            try {
              const res = await fetch("/api/paymongo/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: plan.id }),
              });
              const data = await res.json();
              if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
              } else {
                setPayError(data.error || "Failed to start payment");
                setPayLoading(false);
              }
            } catch {
              setPayError("Network error. Please try again.");
              setPayLoading(false);
            }
          }}
          disabled={payLoading}
          className="w-full relative overflow-hidden rounded-xl py-3.5 text-sm font-extrabold text-white transition-transform active:scale-[0.98] group disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600" />
          <span className="relative flex items-center justify-center gap-2">
            {payLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to payment…</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {!hasExistingToken
                  ? `Continue for ₱${plan.price}`
                  : isExpired
                  ? "Reactivate now"
                  : `Continue for ₱${plan.price}`}
              </>
            )}
          </span>
        </button>
        {payError && <p className="mt-2 text-center text-xs text-red-400">{payError}</p>}
      </div>
    </div>
  );
}

export function RenewClient() {
  const { user, profile, loading, profileLoading, signOut, redeemPromoCode, refreshProfile } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "success" | "failed" | null>(null);
  const [payError, setPayError] = useState("");
  const router = useRouter();

  // Handle PayMongo payment redirect on /renew too
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const plan = params.get("plan");
    const sessionId = params.get("session");
    if (!status || !user) return;

    if (status === "success" && plan) {
      setPaymentStatus("processing");
      const daysToAdd = parseInt(plan, 10);
      window.history.replaceState(null, "", "/renew/");

      if (!profile?.tokenId) {
        (async () => {
          try {
            const userEmail = user?.email?.toLowerCase();
            if (!userEmail) throw new Error("NO_EMAIL");
            const res = await fetch("/api/claim-account", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: userEmail, days: daysToAdd, sessionId }),
            });
            const data = await res.json();
            if (!data.ok) {
              const msg =
                data.error === "no_accounts" ? "All Nuvio accounts are currently taken. Please contact support for a refund." :
                data.error === "payment_not_verified" ? "Payment could not be verified. If you paid, please contact support." :
                "Payment succeeded but account assignment failed. Please contact support.";
              throw new Error(msg);
            }
            await refreshProfile();
            setPaymentStatus("success");
            setTimeout(() => router.push("/dashboard"), 1500);
          } catch (err: any) {
            setPaymentStatus("failed");
            setPayError(err?.message || "Payment failed. Please contact support.");
          }
        })();
      }
    } else if (status === "failed") {
      setPaymentStatus("failed");
      window.history.replaceState(null, "", "/renew/");
    }
  }, [user, profile, refreshProfile, router]);

  // If user has an active profile, redirect to /dashboard
  useEffect(() => {
    if (!loading && !profileLoading && profile?.tokenId && profile?.nuvioEmail) {
      router.replace("/dashboard");
    }
  }, [loading, profileLoading, profile, router]);

  if (loading || !user || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>;
  }

  const isExpired = profile?.expiresAt ? profile.expiresAt.toDate().getTime() < Date.now() : false;
  const hasExistingToken = !!(profile?.tokenId);

  return (
    <main className="min-h-screen pt-20 pb-12 px-3 sm:px-4 lg:px-6 relative">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-600/12 blur-[140px] animate-float" />
        <div className="absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-pink-500/10 blur-[140px] animate-float-slow" />
      </div>
      <div className="mx-auto max-w-2xl">
        {paymentStatus === "processing" && (
          <div className="mb-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-center text-sm text-violet-200">
            Processing your payment…
          </div>
        )}
        {paymentStatus === "success" && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center text-sm text-green-200">
            ✓ Payment successful! Redirecting to your dashboard…
          </div>
        )}
        {paymentStatus === "failed" && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-200">
            {payError || "Payment failed. Please try again or contact support."}
          </div>
        )}
        <div className="text-center mb-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 mb-4">
            <Sparkles className="h-7 w-7 text-violet-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            {!hasExistingToken ? "Choose a Plan" : isExpired ? "Reactivate your account" : "Keep the magic going"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {!hasExistingToken
              ? "Pick a plan below to get instant access to a Nuvio account."
              : isExpired
              ? "Renew now to unlock everything again."
              : "Don't lose access when your subscription ends."}
          </p>
        </div>

        <RenewalHero isExpired={isExpired} hasExistingToken={hasExistingToken} />

        {/* Promo code section */}
        <div className="nuvio-solid-card rounded-2xl p-4 sm:p-5 mt-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-pink-400" /> Have a promo code?
          </h3>
          <div className="flex gap-2 items-stretch">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
              disabled={promoLoading}
            />
            <button
              onClick={async () => {
                if (!promoCode.trim()) return;
                setPromoLoading(true);
                setPromoMessage("");
                try {
                  const result = await redeemPromoCode(promoCode);
                  setPromoMessage(result.message);
                  if (result.success) {
                    setPromoCode("");
                    setTimeout(() => router.push("/dashboard"), 1500);
                  }
                } catch {
                  setPromoMessage("Failed to redeem promo code. Try again.");
                } finally {
                  setPromoLoading(false);
                }
              }}
              disabled={promoLoading || !promoCode.trim()}
              className="nuvio-gradient-bg shrink-0 rounded-xl px-4 sm:px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-95 transition whitespace-nowrap flex items-center gap-1.5"
            >
              {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              <span>Redeem</span>
            </button>
          </div>
          {promoMessage && (
            <p className={`mt-2 text-xs ${promoMessage.includes("redeemed") ? "text-green-400" : "text-red-400"}`}>
              {promoMessage}
            </p>
          )}
        </div>

        <div className="text-center mt-4">
          <button onClick={signOut} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
            <LogOut className="h-3 w-3" /> Log out
          </button>
        </div>
      </div>
    </main>
  );
}
