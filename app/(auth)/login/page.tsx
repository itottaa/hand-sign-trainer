'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤟</div>
          <h1 className="text-2xl font-bold text-slate-900">Hand Sign Trainer</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required disabled={isLoading} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">Register here</Link>
        </p>
      </div>
    </div>
  );
}
