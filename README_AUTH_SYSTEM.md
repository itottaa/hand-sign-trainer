# Hand Sign Trainer - Authentication & Role-Based System

## Quick Start

1. **Install dependencies**: `pnpm install`
2. **Set environment variables** in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
3. **Run migrations** in Supabase SQL editor:
   - `scripts/001-create-base-tables.sql`
   - `scripts/002-create-rls-policies.sql`
4. **Start dev server**: `pnpm dev`
5. **Visit** http://localhost:3000

## What's Included

### Complete Authentication System
- User registration with role selection (Teacher/Student)
- Secure login with Supabase JWT
- Protected routes via Next.js middleware
- Auth context provider for global state
- Automatic role-based redirects

### Teacher Features
- **Dashboard**: View students, signs, and quick actions
- **Student Management**: Create student accounts, set credentials
- **Sign Management**: Create signs with categories and difficulty
- **Progress Tracking**: View student performance metrics
- **Category Organization**: Group signs by type

### Student Features
- **Dashboard**: Browse available signs from teacher
- **Filtering**: Filter by category and difficulty
- **Practice Mode**: Real-time hand detection and accuracy scoring
- **Score Tracking**: Best score, attempt count, session history
- **Feedback**: Instant accuracy percentage and encouragement

### Database (Supabase)
- `users` - User profiles with role
- `teacher_profiles` - Teacher-specific data
- `student_profiles` - Student-specific data linked to teacher
- `sign_categories` - Sign categories created by teachers
- `hand_signs` - Hand signs with difficulty and description
- `practice_sessions` - Student practice records with accuracy scores

### Security
- JWT authentication
- Middleware route protection
- Row-Level Security (RLS) on database
- Role-based access control
- Student isolation per teacher

## Key Features

### ✓ Hand Detection with Accuracy
- Real-time hand detection (only when hand visible)
- Live accuracy scoring during practice
- Automatic session saving
- Best score tracking per sign

### ✓ Category System
- Teachers create custom categories
- Students filter by category
- Organized sign library

### ✓ Difficulty Levels
- Easy, Medium, Hard
- Color-coded display
- Helps students choose appropriate signs

### ✓ Progress Analytics
- Total attempts counted
- Best score tracked
- Session history saved
- Real-time feedback

## File Guide

### Authentication
- `lib/auth-context.tsx` - Auth state management
- `lib/supabase.ts` - Supabase client setup
- `middleware.ts` - Route protection

### Pages - Auth
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`

### Pages - Teacher
- `app/(app)/teacher/dashboard/page.tsx`
- `app/(app)/teacher/students/add/page.tsx`
- `app/(app)/teacher/signs/new/page.tsx`

### Pages - Student
- `app/(app)/student/dashboard/page.tsx`
- `app/(app)/student/practice/[signId]/page.tsx`

### Database
- `scripts/001-create-base-tables.sql` - Schema
- `scripts/002-create-rls-policies.sql` - Security

## How to Use

### For Teachers

1. **Register Account**
   - Go to landing page
   - Click "Create Account"
   - Select "Teacher" role
   - Fill in details and submit

2. **Create Signs**
   - Go to dashboard
   - Click "Create Sign"
   - Fill in: Name, Category, Difficulty, Description
   - Submit

3. **Add Students**
   - Go to dashboard
   - Click "Add Student"
   - Provide: Name, Email, Password
   - Share credentials with student

4. **Monitor Progress**
   - View student list with enrollent dates
   - Click "View Progress" to see analytics

### For Students

1. **Register/Login**
   - Use credentials provided by teacher
   - OR register with "Student" role

2. **Practice Signs**
   - View available signs on dashboard
   - Click "Practice This Sign"
   - Click "Start Practice"
   - Show hand to camera
   - See real-time accuracy feedback
   - Click "Stop Practice" to save

3. **Track Progress**
   - See best score for each sign
   - Track total attempts
   - View difficulty level
   - Read sign instructions

## Architecture Overview

```
Frontend (React/Next.js)
    ↓
Auth Context (useAuth hook)
    ↓
Supabase Auth (JWT)
    ↓
Middleware (Route Protection)
    ↓
Database (PostgreSQL)
```

## Database Schema

**Users Table**
```
id (UUID) - Primary Key
email - Unique email
full_name - User's name
role - 'teacher' or 'student'
created_at - Account creation date
```

**Sign Categories**
```
id (UUID)
name - Category name
teacher_id - Teacher who created it
description - Optional details
```

**Hand Signs**
```
id (UUID)
name - Sign name
category_id - Which category
teacher_id - Creator teacher
difficulty - easy/medium/hard
description - Instructions
```

**Practice Sessions**
```
id (UUID)
student_id - Who practiced
sign_id - What sign
accuracy_score - 0-100 score
attempts - How many tries
best_score - Personal best
session_date - When practiced
```

## Environment Variables

```bash
# Required for authentication and database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from Supabase project settings → API.

## Deployment

### To Vercel

1. Connect GitHub repository
2. Add environment variables in Vercel settings
3. Deploy button, done!

### Post-Deployment

1. Go to Supabase → Authentication → URL Configuration
2. Add Vercel URL to Authorized Redirect URLs:
   - `https://your-vercel-url.vercel.app`
   - `https://your-vercel-url.vercel.app/auth/callback`
3. Save

## Common Workflows

### Teacher Adding Student
```
Teacher Dashboard → Add Student → Fill Form → Submit
→ Student account created in database
→ Student profile linked to teacher
→ Email sent to student (optional)
→ Student can login with provided credentials
```

### Teacher Creating Sign
```
Teacher Dashboard → Create Sign → Enter Details → Submit
→ Sign saved to database
→ Linked to teacher and category
→ Automatically visible to students
```

### Student Practicing
```
Student Dashboard → Select Sign → Start Practice
→ Camera activates
→ Hand detection enabled
→ Recognition starts when hand visible
→ Accuracy % updates in real-time
→ Student adjusts position
→ Stops practice
→ Session saved to database
→ Best score updated
```

## Troubleshooting

### "Can't login"
- Check email and password
- Verify account was created
- Try password reset (feature to be added)

### "Can't see teacher's signs"
- Make sure student account is linked to teacher
- Check teacher created signs
- Verify signs have categories

### "Hand detection not working"
- Allow camera permissions in browser
- Check camera access in browser settings
- Ensure good lighting
- Click "Start Practice" button

### "Accuracy not saving"
- Check internet connection
- Verify Supabase is running
- Check browser console for errors
- Try again after stopping practice

### "Getting authentication error"
- Check environment variables are set
- Verify Supabase project is active
- Check URL and key are correct
- Clear browser cookies and login again

## API Endpoints

The application uses:
- Supabase REST API (auto-generated)
- No custom API routes needed
- Direct client-side Supabase queries

All requests authenticated with JWT token from Supabase Auth.

## Testing

### Test Account Credentials
After setup, create test accounts:

**Teacher**
- Email: teacher@example.com
- Password: testpassword123
- Role: Teacher

**Student**
- Email: student@example.com  
- Password: testpassword123
- Role: Student

Then:
1. Login as teacher
2. Create categories and signs
3. Add student account
4. Login as student
5. Practice signs and verify accuracy saves

## Next Features to Add

- [ ] Email verification
- [ ] Password reset
- [ ] Student progress dashboard
- [ ] Achievement badges
- [ ] Video demonstrations
- [ ] Timed practice challenges
- [ ] Leaderboards
- [ ] PDF reports
- [ ] Dark mode
- [ ] Mobile optimization

## Support & Docs

**Implementation Docs**
- `AUTH_IMPLEMENTATION_SUMMARY.md` - Architecture details
- `SETUP_GUIDE.md` - Step-by-step setup
- `COMPLETE_IMPLEMENTATION.md` - Full feature list
- `VISUAL_REFERENCE.md` - Diagrams and flows

**Code Comments**
- All main components have inline comments
- Check `lib/auth-context.tsx` for auth flow
- Check `app/(app)/student/practice/[signId]/page.tsx` for accuracy tracking

**Error Logs**
- Check browser console (F12) for client errors
- Check Supabase dashboard for database issues
- Check Network tab for API failures

## License

This project is open source and available under the MIT license.

## Credits

Built with:
- React 19.2 + Next.js 16
- Supabase (PostgreSQL + Auth)
- TensorFlow.js (Hand recognition)
- Tailwind CSS + shadcn/ui
- Vercel (Hosting)

---

**Ready to deploy?** Follow the SETUP_GUIDE.md for step-by-step instructions!

