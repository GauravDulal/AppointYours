'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/auth';
import { Stethoscope, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@dentalflow.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/login`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid credentials');
      }

      const data = await response.json();
      setToken(data.access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-12">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-600/15 blur-3xl" />

      <div className="animate-scale-in relative w-full max-w-md">
        {/* Glass card */}
        <div className="glass-dark rounded-2xl p-8 shadow-2xl shadow-blue-900/20">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="gradient-primary mb-4 flex h-14 w-14 items-center justify-center rounded-xl shadow-lg shadow-blue-600/30">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              DentalFlow
            </h1>
            <p className="mt-1 text-sm text-blue-200/60">
              Social Booker — Admin Dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-3">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-blue-200/50">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="admin@dentalflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-blue-200/50">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="gradient-primary group relative flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-blue-200/30">
            Demo: admin@dentalflow.com / password123
          </p>
        </div>
      </div>
    </div>
  );
}
