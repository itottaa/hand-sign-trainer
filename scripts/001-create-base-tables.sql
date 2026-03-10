-- Create base tables for Hand Sign Trainer

-- Users table with role
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'student')) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teacher metadata
CREATE TABLE IF NOT EXISTS teacher_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  school_name TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student metadata
CREATE TABLE IF NOT EXISTS student_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id_code TEXT UNIQUE NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sign categories table
CREATE TABLE IF NOT EXISTS sign_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO sign_categories (name, description, color) VALUES
  ('Greetings', 'Common greeting signs', '#fbbf24'),
  ('Numbers', 'Number signs 0-9', '#60a5fa'),
  ('Colors', 'Common color signs', '#34d399'),
  ('Actions', 'Action and verb signs', '#f472b6'),
  ('Emotions', 'Emotion and feeling signs', '#a78bfa'),
  ('Questions', 'Question and interrogative signs', '#fb7185'),
  ('Common Phrases', 'Frequently used phrases', '#06b6d4')
ON CONFLICT DO NOTHING;

-- Signs table (created by teachers)
CREATE TABLE IF NOT EXISTS signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES sign_categories(id) ON DELETE SET NULL,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) NOT NULL DEFAULT 'beginner',
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, name)
);

-- Practice sessions (track student practice and accuracy)
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sign_id UUID NOT NULL REFERENCES signs(id) ON DELETE CASCADE,
  accuracy_score FLOAT NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
  attempts_count INTEGER NOT NULL DEFAULT 1,
  best_score FLOAT CHECK (best_score >= 0 AND best_score <= 100),
  last_practiced TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  practice_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, sign_id, practice_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_teacher_metadata_user_id ON teacher_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_student_metadata_user_id ON student_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_student_metadata_teacher_id ON student_metadata(teacher_id);
CREATE INDEX IF NOT EXISTS idx_signs_teacher_id ON signs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_signs_category_id ON signs(category_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_student_id ON practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_sign_id ON practice_sessions(sign_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_practice_date ON practice_sessions(practice_date);

-- Create triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signs_updated_at BEFORE UPDATE ON signs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
