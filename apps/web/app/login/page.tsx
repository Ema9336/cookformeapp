"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"customer" | "chef">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const me = await login(email, password);
      if (me.role === "ADMIN") {
        router.push("/admin-compliance");
      } else if (me.role === "CHEF") {
        router.push("/chef-dashboard");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_15%_12%,#f7fcf9_0,#ffffff_42%,#f8fbff_100%)] px-4 py-10">
      <div className="w-full max-w-md space-y-7 rounded-3xl border border-emerald-100 bg-white/95 shadow-[0_22px_60px_-36px_rgba(6,78,59,0.55)] p-6 sm:p-8">
        <div className="text-center">
          <span className="text-4xl">{mode === "chef" ? "👨‍🍳" : "🍽️"}</span>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-slate-500 text-sm">Sign in to your Cook For Me account</p>
        </div>

        <div className="flex rounded-2xl border border-emerald-200 bg-emerald-50/40 p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("customer")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === "customer"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🍽️ I&apos;m a Customer
          </button>
          <button
            type="button"
            onClick={() => setMode("chef")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === "chef"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            👨‍🍳 I&apos;m a Chef
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 text-base transition-colors"
          >
            {loading ? "Signing in…" : mode === "chef" ? "Sign in as Chef" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-emerald-600 font-medium hover:underline">
            Sign up
          </Link>
          {mode === "chef" && (
            <>
              {" · "}
              <Link href="/chef-onboarding" className="text-emerald-600 font-medium hover:underline">
                Become a Chef
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
