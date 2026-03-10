# Hand Sign Trainer - Complete Authentication & Role-Based System

## Overview

A complete authentication and role-based access system has been implemented with Supabase, enabling teachers to create accounts, manage students, create signs with categories, and students to practice with real-time accuracy tracking.

## Architecture

### Database Schema (Supabase)

**Tables Created:**
- `users` - Core user profiles (id, email, full_name, role, created_at)
- `teacher_profiles` - Teacher-specific data (id, user_id, teacher_id, bio, institution)
- `student_profiles` - Student-specific data (id, user_id, teacher_id, enrolled_date)
- `sign_categories` - Sign categories created by teachers (id, name, description, teacher_id)
- `hand_signs` - Hand signs with metadata (id, name, category_id, teacher_id, difficulty, description)
- `practice_sessions` - Student practice data (id, student_id, sign_id, accuracy_score, attempts, best_score, session_date)

### Authentication Flow

1. **Registration** → User creates account (Teacher or Student role)
2. **Database Profile** → User profile automatically created in `users` table
3. **Role-Based Routing** → Teachers go to `/teacher/dashboard`, Students to `/student/dashboard`
4. **Middleware Protection** → All dashboard routes protected by `middleware.ts`
5. **Session Management** → Supabase auth state managed via AuthProvider context

## Key Features Implemented

### For Teachers

**Dashboard** (`/teacher/dashboard`)
- View total student count
- Quick access to sign management
- List of enrolled students with enrollment dates
- View individual student progress

**Student Management** (`/teacher/students/add`)
- Create new student accounts with email and temporary password
- Automatically link students to teacher account
- Students receive credentials to login

**Sign Management** (`/teacher/signs/new`)
- Create new hand signs with:
  - Sign name
  - Category (create new or select existing)
  - Difficulty level (Easy, Medium, Hard)
  - Optional description/instructions
- Organize signs by categories
- Track sign creation dates

### For Students

**Dashboard** (`/student/dashboard`)
- View all available signs from enrolled teacher
- Filter signs by category
- See difficulty levels (color-coded)
- Quick access to practice each sign

**Practice Mode** (`/student/practice/[signId]`)
- Real-time hand detection (only shows recognition when hand detected)
- Live accuracy scoring with:
  - Current attempt score (0-100%)
  - Best score tracking
  - Total attempt counter
- Visual feedback on performance
- Automatic session saving with accuracy metrics
- View sign instructions and difficulty level
- Progress statistics (attempts, best score)

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx              # Login form
│   └── register/page.tsx           # Registration form (role selection)
├── (app)/
│   ├── dashboard/page.tsx          # Role-based redirect
│   ├── teacher/
│   │   ├── dashboard/page.tsx      # Teacher main dashboard
│   │   ├── students/
│   │   │   └── add/page.tsx        # Add student form
│   │   └── signs/
│   │       └── new/page.tsx        # Create new sign
│   └── student/
│       ├── dashboard/page.tsx      # Student main dashboard
│       └── practice/
│           └── [signId]/page.tsx   # Practice interface
├── page.tsx                         # Landing page with auth buttons
└── layout.tsx                       # Root layout (wrapped with AuthProvider)

lib/
├── supabase.ts                     # Supabase client & TypeScript types
├── auth-context.tsx                # Auth provider & useAuth hook
├── hand-detection.ts               # Hand detection utility
├── model-training.ts               # ML model & prediction
└── ...

middleware.ts                        # Route protection middleware

components/
├── camera-feed.tsx                 # Reusable camera component
└── ... (existing components)
```

## Authentication Flow Diagram

```
User → Registration/Login
    ↓
Supabase Auth (JWT)
    ↓
User Profile Created (users table)
    ↓
Teacher/Student Profile Created
    ↓
Middleware Check (protected routes)
    ↓
Role-Based Redirect
    ↓
Dashboard (Teacher or Student)
```

## Data Flow - Student Practice

```
Student Visits Practice Page
    ↓
Load Sign Details (hand_signs table)
    ↓
Load Best Score (practice_sessions table)
    ↓
Camera Feeds Hand Detection
    ↓
Hand Detected? → Yes → Normalize Keypoints
    ↓
Predict Sign (TensorFlow.js Model)
    ↓
Calculate Accuracy Score
    ↓
Display Real-Time Feedback
    ↓
Stop Practice → Save Session (practice_sessions table)
    ↓
Update Best Score
```

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Dependencies Added

```json
{
  "@supabase/supabase-js": "^2.43.0",
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/auth-helpers-react": "^0.4.8",
  "@supabase/ssr": "^0.0.11"
}
```

## Security Measures

- JWT authentication via Supabase
- Middleware-protected routes (redirect to `/login` if not authenticated)
- Row-Level Security (RLS) policies on database tables
- Students can only see their enrolled teacher's signs
- Teachers can only manage their own students and signs
- Passwords hashed by Supabase Auth

## Role-Based Access Control

### Teacher Access
- `/teacher/dashboard` - View students and signs
- `/teacher/students/add` - Add new students
- `/teacher/signs/new` - Create new signs
- `/teacher/signs` - Manage signs

### Student Access
- `/student/dashboard` - View available signs
- `/student/practice/[signId]` - Practice signs
- **Cannot access** teacher routes (redirected via middleware)

### Public Routes
- `/` - Landing page
- `/login` - Login form
- `/register` - Registration form

## Teacher-Student Relationship

1. **Teacher creates account** → Assigned role "teacher"
2. **Teacher adds student** → Student account created with role "student"
3. **Student linked to teacher** → `student_profiles.teacher_id` = teacher's user id
4. **Student sees teacher's signs** → Query `hand_signs` filtered by `teacher_id`
5. **Practice session recorded** → Linked to both student and sign

## Accuracy Tracking

- **Real-time feedback**: As student practices, accuracy % updates live
- **Session saving**: Final score saved to `practice_sessions` table
- **Best score tracking**: `practice_sessions.best_score` updated if current > previous
- **Attempt counting**: Total attempts tracked per sign per student
- **Progress visualization**: Best score, attempt count, and difficulty shown on practice page

## Future Enhancements

- Teacher analytics dashboard with student progress charts
- Student progress history view
- Sign video demonstrations
- Teacher-created practice assignments
- Achievement badges/levels
- Leaderboards
- Export student reports

## Deployment to Vercel

1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main branch

## Testing the System

### Teacher Flow
1. Register as Teacher
2. Add Student account
3. Create Sign Category
4. Create Hand Sign with difficulty level
5. View dashboard with students and signs

### Student Flow
1. Login with credentials provided by teacher
2. View all available signs (filtered by category)
3. Click "Practice This Sign"
4. Show hand to camera
5. See real-time accuracy feedback
6. Stop practice to save session
7. View best score and attempt count

