'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: string;
  email: string;
  full_name: string;
  enrolled_date: string;
}

export default function TeacherDashboard() {
  const { user, isTeacher, signOut } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isTeacher) {
      router.push('/dashboard');
      return;
    }

    fetchStudents();
  }, [isTeacher, router]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          id,
          users(id, email, full_name),
          enrolled_date
        `)
        .eq('teacher_id', user?.id);

      if (error) throw error;
      
      setStudents(
        (data || []).map((profile: any) => ({
          id: profile.id,
          email: profile.users?.email,
          full_name: profile.users?.full_name,
          enrolled_date: profile.enrolled_date,
        }))
      );
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
            <p className="text-slate-600">Manage your students and signs</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-slate-900">{students.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Create New Sign</h3>
            <p className="text-slate-600 text-sm mb-4">Add a new sign with category and difficulty</p>
            <Link href="/teacher/signs/new">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Create Sign
              </Button>
            </Link>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Manage Signs</h3>
            <p className="text-slate-600 text-sm mb-4">Edit or delete existing signs</p>
            <Link href="/teacher/signs">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                View Signs
              </Button>
            </Link>
          </Card>
        </div>

        {/* Students Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Your Students</h2>
            <Link href="/teacher/students/add">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Add Student
              </Button>
            </Link>
          </div>

          {students.length === 0 ? (
            <p className="text-slate-600 text-center py-8">No students enrolled yet. Add one to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Enrolled</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900">{student.full_name}</td>
                      <td className="px-6 py-4 text-slate-600">{student.email}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(student.enrolled_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/teacher/students/${student.id}/progress`}>
                          <Button variant="outline" className="text-sm">
                            View Progress
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
