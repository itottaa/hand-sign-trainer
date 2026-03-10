# Setup Guide - Hand Sign Trainer with Authentication

## Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account (https://supabase.com)
- GitHub account (for deployment)
- Vercel account (for hosting)

## Step 1: Supabase Setup

### Create a Supabase Project
1. Go to https://supabase.com and sign up/login
2. Create a new project:
   - Name: "Hand Sign Trainer"
   - Database password: Generate strong password
   - Region: Choose closest to your location
3. Wait for project to initialize (2-3 minutes)

### Get Your Credentials
1. Go to Project Settings → API
2. Copy and save:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Create Database Tables
1. In Supabase dashboard, go to SQL Editor
2. Run the migration scripts in order:
   ```
   scripts/001-create-base-tables.sql
   scripts/002-create-rls-policies.sql
   ```
3. Each script will create necessary tables and security policies

### Optional: Set Up RLS Policies
1. Go to Authentication → Policies in Supabase dashboard
2. Enable Row Level Security (RLS) on each table:
   - users
   - teacher_profiles
   - student_profiles
   - sign_categories
   - hand_signs
   - practice_sessions
3. Apply the RLS policies from script 002

## Step 2: Local Development Setup

### Clone and Install Dependencies
```bash
# Clone or download your project
cd hand-sign-trainer

# Install dependencies
pnpm install
```

### Configure Environment Variables
1. Create `.env.local` file in project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace with actual values from Step 1

### Run Development Server
```bash
pnpm dev
```

Visit http://localhost:3000 to see the app

## Step 3: Test the Authentication System

### Create a Teacher Account
1. Click "Create Account" on landing page
2. Fill in:
   - Full Name: e.g., "John Doe"
   - Email: e.g., "teacher@example.com"
   - Password: Strong password
   - Role: Select "Teacher"
3. Click "Create Account"
4. Redirected to teacher dashboard

### Create a Student Account
1. Go back to home page, click "Create Account"
2. Fill in:
   - Full Name: e.g., "Jane Smith"
   - Email: e.g., "student@example.com"
   - Password: Temporary password
   - Role: Select "Student"
3. Click "Create Account"
4. Redirected to student dashboard

### Alternatively: Teacher Creates Student
1. Login as teacher
2. Click "Add Student" button
3. Enter student details:
   - Full Name
   - Email
   - Temporary Password
4. Share credentials with student

## Step 4: Create Signs and Categories

### As Teacher:
1. Go to Teacher Dashboard
2. Click "Create Sign" button
3. Fill in:
   - Sign Name: e.g., "Hello"
   - Category: Create new or select existing
   - Difficulty: Easy/Medium/Hard
   - Description: Optional instructions
4. Click "Create Sign"

### Create Multiple Signs
- Add 3-5 signs to different categories
- Vary difficulty levels

## Step 5: Test Practice Mode

### As Student:
1. Login with student credentials
2. View available signs on dashboard
3. Filter by category (optional)
4. Click "Practice This Sign"
5. Click "Start Practice"
6. Show your hand to camera
7. See real-time accuracy score
8. Adjust hand position to improve score
9. Click "Stop Practice" to save session
10. View your best score and attempt count

## Step 6: Deployment to Vercel

### Prepare GitHub Repository
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial Hand Sign Trainer with authentication"

# Create repo on GitHub (handsome-sign-trainer)
# Push to GitHub
git remote add origin https://github.com/yourusername/hand-sign-trainer.git
git push -u origin main
```

### Deploy to Vercel
1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Select "Next.js" framework
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your_url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your_key
6. Click "Deploy"
7. Wait 2-5 minutes for deployment
8. Get your live URL

### Configure Supabase for Production
1. In Supabase dashboard:
2. Go to Authentication → URL Configuration
3. Add your Vercel URL to Authorized Redirect URLs:
   - `https://yourvercelurl.vercel.app`
   - `https://yourvercelurl.vercel.app/auth/callback`
4. Save

## Step 7: Verify Deployment

1. Visit your Vercel URL
2. Test the full flow:
   - Register teacher account
   - Register student account
   - Create signs
   - Practice as student
   - View accuracy tracking

## Troubleshooting

### "Supabase connection failed"
- Check `NEXT_PUBLIC_SUPABASE_URL` and key are correct
- Verify environment variables in `.env.local`
- Make sure Supabase project is active

### "Hand detection not working"
- Check browser camera permissions
- Allow camera access when prompted
- Ensure good lighting

### "Redirect to login keeps happening"
- Check if session expired
- Clear browser cookies and login again
- Verify Supabase JWT tokens are valid

### "Student can't see teacher's signs"
- Verify student was created with correct teacher_id
- Check sign_categories has correct teacher_id
- Verify RLS policies are enabled

### "Accuracy score not saving"
- Check practice_sessions table exists in Supabase
- Verify RLS allows student_id to insert
- Check browser console for errors

## File Access

### Database Schema
- Migration scripts: `scripts/001-create-base-tables.sql`, `scripts/002-create-rls-policies.sql`

### Key Configuration Files
- Auth context: `lib/auth-context.tsx`
- Supabase client: `lib/supabase.ts`
- Middleware: `middleware.ts`

### Important Pages
- Landing: `app/page.tsx`
- Login: `app/(auth)/login/page.tsx`
- Register: `app/(auth)/register/page.tsx`
- Teacher Dashboard: `app/(app)/teacher/dashboard/page.tsx`
- Student Dashboard: `app/(app)/student/dashboard/page.tsx`
- Practice: `app/(app)/student/practice/[signId]/page.tsx`

## Next Steps

- Customize landing page with your branding
- Add teacher profile customization
- Implement progress reports and analytics
- Add sign video demonstrations
- Create achievement badges system
- Set up email notifications

## Support

If you encounter issues:
1. Check `AUTH_IMPLEMENTATION_SUMMARY.md` for architecture details
2. Review `SETUP_GUIDE.md` (this file) for common issues
3. Check browser console (F12) for error messages
4. Verify all environment variables are set correctly
5. Check Supabase dashboard for data integrity

