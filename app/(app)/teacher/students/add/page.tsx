'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddStudentPage() {
  const { user, isTeacher } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Register new student user via standard signUp (no admin needed)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'student' },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Insert profile manually in case trigger hasn't fired yet
      const { error: profileError } = await supabase.from('users').upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'student',
      });
      // Ignore profile errors silently (trigger may have already inserted)

      // Link student to this teacher
      const { error: studentError } = await supabase.from('student_profiles').insert({
        user_id: authData.user.id,
        teacher_id: user?.id,
      });

      if (studentError) throw studentError;

      setSuccess(`Student account created for ${fullName}! They can log in with ${email}`);
      setEmail('');
      setFullName('');
      setPassword('');
      setTimeout(() => router.push('/teacher/dashboard'), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">Only teachers can access this page.</p>
          <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/teacher/dashboard" className="text-blue-600 hover:underline text-sm block mb-1">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900">Add Student</h1>
          <p className="text-slate-500 text-sm">Create a student account and link it to your class</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-8">
          {error && <Alert className="mb-6 bg-red-50 border-red-200 text-red-700">{error}</Alert>}
          {success && <Alert className="mb-6 bg-green-50 border-green-200 text-green-700">{success}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student Full Name *</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan dela Cruz" required disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com" required disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required disabled={isLoading} minLength={6} />
              <p className="text-xs text-slate-400 mt-1">Share this with the student. They can change it after logging in.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading ? 'Creating account...' : 'Create Student Account'}
              </Button>
              <Link href="/teacher/dashboard" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
