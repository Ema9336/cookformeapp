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
      await login(email, password);
      router.push(mode === "chef" ? "/chef-dashboard" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / brand */}
        <div className="text-center">
          <span className="text-4xl">{mode === "chef" ? "👨‍🍳" : "🍽️"}</span>
          <h1 className="mt-3 text-3xl font-bold text-black dark:text-white">Welcome back</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Sign in to your CookForMe account</p>
        </div>

        {/* Role toggle */}
        <div className="flex rounded-2xl border border-gray-200 dark:border-gray-700 p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("customer")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === "customer"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            }`}
          >
            🍽️ I&apos;m a Customer
          </button>
          <button
            type="button"
            onClick={() => setMode("chef")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              mode === "chef"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            }`}
          >
            👨‍🍳 I&apos;m a Chef
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm transition-colors"
          >
            {loading ? "Signing in…" : mode === "chef" ? "Sign in as Chef" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-green-600 font-medium hover:underline">
            Sign up
          </Link>
          {mode === "chef" && (
            <>
              {" · "}
              <Link href="/chef-onboarding" className="text-green-600 font-medium hover:underline">
                Become a Chef
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
