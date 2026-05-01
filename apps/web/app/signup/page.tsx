"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, name, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / brand */}
        <div className="text-center">
          <span className="text-4xl">🍳</span>
          <h1 className="mt-3 text-3xl font-bold text-black dark:text-white">Create account</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">Join CookForMe and get home-cooked meals</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Jane Smith"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 text-sm transition-colors"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
