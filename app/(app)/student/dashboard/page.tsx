'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, SignCategory, HandSign } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SignWithCategory extends HandSign {
  category_name?: string;
}

export default function StudentDashboard() {
  const { user, isStudent, signOut } = useAuth();
  const [categories, setCategories] = useState<SignCategory[]>([]);
  const [signs, setSigns] = useState<SignWithCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isStudent) {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [isStudent, router]);

  const fetchData = async () => {
    try {
      // Get teacher ID for this student
      const { data: studentProfile, error: studentError } = await supabase
        .from('student_profiles')
        .select('teacher_id')
        .eq('user_id', user?.id)
        .single();

      if (studentError || !studentProfile) {
        console.error('Error fetching student profile:', studentError);
        return;
      }

      const teacherId = studentProfile.teacher_id;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('sign_categories')
        .select('*')
        .eq('teacher_id', teacherId);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch all signs
      const { data: signsData, error: signsError } = await supabase
        .from('hand_signs')
        .select(`
          *,
          sign_categories(name)
        `)
        .eq('teacher_id', teacherId);

      if (signsError) throw signsError;
      
      setSigns(
        (signsData || []).map((sign: any) => ({
          ...sign,
          category_name: sign.sign_categories?.name,
        }))
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const filteredSigns = selectedCategory
    ? signs.filter((sign) => sign.category_id === selectedCategory)
    : signs;

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
            <h1 className="text-2xl font-bold text-slate-900">Practice Dashboard</h1>
            <p className="text-slate-600">Learn and practice hand signs</p>
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
        {/* Categories Filter */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedCategory(null)}
              variant={selectedCategory === null ? 'default' : 'outline'}
              className={selectedCategory === null ? 'bg-blue-600' : ''}
            >
              All Signs
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                className={selectedCategory === category.id ? 'bg-blue-600' : ''}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Signs Grid */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Available Signs ({filteredSigns.length})
          </h2>

          {filteredSigns.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-600">No signs available in this category yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSigns.map((sign) => (
                <Card key={sign.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{sign.name}</h3>
                      <p className="text-sm text-slate-600">{sign.category_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      sign.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      sign.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sign.difficulty.charAt(0).toUpperCase() + sign.difficulty.slice(1)}
                    </span>
                  </div>

                  {sign.description && (
                    <p className="text-slate-600 text-sm mb-4">{sign.description}</p>
                  )}

                  <Link href={`/student/practice/${sign.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Practice This Sign
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
