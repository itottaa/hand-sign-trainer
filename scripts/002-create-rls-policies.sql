-- Row Level Security policies for Hand Sign Trainer

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE sign_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Teacher metadata policies
CREATE POLICY "Teachers can view own metadata" ON teacher_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can update own metadata" ON teacher_metadata
  FOR UPDATE USING (auth.uid() = user_id);

-- Student metadata policies
CREATE POLICY "Students can view own metadata" ON student_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view their students" ON student_metadata
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their students" ON student_metadata
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Sign categories are public readable
CREATE POLICY "Anyone can read categories" ON sign_categories
  FOR SELECT USING (true);

-- Signs policies
CREATE POLICY "Teachers can view their own signs" ON signs
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view signs from their teacher" ON signs
  FOR SELECT USING (
    teacher_id IN (
      SELECT teacher_id FROM student_metadata WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create signs" ON signs
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own signs" ON signs
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own signs" ON signs
  FOR DELETE USING (auth.uid() = teacher_id);

-- Practice sessions policies
CREATE POLICY "Students can view own practice sessions" ON practice_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their students' practice sessions" ON practice_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT user_id FROM student_metadata WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can create practice sessions" ON practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their practice sessions" ON practice_sessions
  FOR UPDATE USING (auth.uid() = student_id);
