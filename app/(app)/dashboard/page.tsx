'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    if (role === 'teacher') router.push('/teacher/dashboard');
    else if (role === 'student') router.push('/student/dashboard');
    // if role not loaded yet, wait
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
