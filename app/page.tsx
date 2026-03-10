'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white">Hand Sign Trainer</h1>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Account
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Learn Sign Language with AI
        </h2>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Practice hand signs in real-time with AI-powered accuracy feedback. Teachers create signs, students practice and improve.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          {/* Teacher Section */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8 text-white">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-2xl font-bold mb-4">For Teachers</h3>
            <p className="text-slate-300 mb-6">
              Create custom sign categories, manage student accounts, and track their progress with detailed accuracy metrics.
            </p>
            <ul className="text-left space-y-2 text-slate-300 mb-8">
              <li>✓ Create and manage sign categories</li>
              <li>✓ Add students to your class</li>
              <li>✓ Track student progress</li>
              <li>✓ View accuracy analytics</li>
            </ul>
            <Link href="/register">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Create Teacher Account
              </Button>
            </Link>
          </div>

          {/* Student Section */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8 text-white">
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h3 className="text-2xl font-bold mb-4">For Students</h3>
            <p className="text-slate-300 mb-6">
              Practice signs in real-time with instant accuracy feedback. Track your improvement and master new signs.
            </p>
            <ul className="text-left space-y-2 text-slate-300 mb-8">
              <li>✓ Browse teacher's sign library</li>
              <li>✓ Practice with real-time feedback</li>
              <li>✓ Track personal progress</li>
              <li>✓ View accuracy scores</li>
            </ul>
            <Link href="/register">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Create Student Account
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
