import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for our database schema
export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface TeacherProfile extends UserProfile {
  bio?: string;
  institution?: string;
}

export interface StudentProfile extends UserProfile {
  teacher_id: string;
  enrolled_date: string;
}

export interface SignCategory {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  created_at: string;
}

export interface HandSign {
  id: string;
  name: string;
  category_id: string;
  teacher_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description?: string;
  video_url?: string;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  student_id: string;
  sign_id: string;
  accuracy_score: number;
  attempts: number;
  best_score: number;
  session_date: string;
  created_at: string;
}
