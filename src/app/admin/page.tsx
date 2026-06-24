"use client";

import { useState } from "react";
import { Lock, Download, RefreshCw, Mail, ArrowLeft } from "lucide-react";

interface Lead {
  email: string;
  source: string;
  createdAt: string;
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLeads = async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leads?key=${encodeURIComponent(k)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unauthorized");
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setLeads(data.leads ?? []);
    } catch {
      setError("Network error");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    fetchLeads(key.trim());
  };

  const downloadCsv = () => {
    window.open(`/api/leads?key=${encodeURIComponent(key)}&format=csv`, "_blank");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-20 pb-12 px-4">
      <div className="w-full max-w-3xl">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </a>

        {!authed ? (
          <div className="nuvio-card rounded-2xl p-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl nuvio-gradient-bg text-white">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold">Nuvio Admin</h1>
                <p className="text-sm text-muted-foreground">View collected leads</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="key" className="block text-sm font-medium mb-1.5">
                  Admin key
                </label>
                <input
                  id="key"
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter admin key"
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/40"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400" role="alert">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="nuvio-gradient-bg w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 active:scale-95 transition-transform"
              >
                {loading ? "Checking…" : "Unlock"}
              </button>
            </form>
          </div>
        ) : (
          <div className="nuvio-card rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-xl font-bold">Collected leads</h1>
                <p className="text-sm text-muted-foreground">
                  {leads.length} email{leads.length === 1 ? "" : "s"} collected
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchLeads(key)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3.5 py-2 text-sm font-medium hover:bg-secondary/80 active:scale-95 transition"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="nuvio-gradient-bg inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
                >
                  <Download className="h-4 w-4" /> CSV
                </button>
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Mail className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No leads collected yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Email</th>
                      <th className="text-left p-3 font-semibold hidden sm:table-cell">Source</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.email} className="border-t border-border">
                        <td className="p-3 font-medium">{l.email}</td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">{l.source}</td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(l.createdAt).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
