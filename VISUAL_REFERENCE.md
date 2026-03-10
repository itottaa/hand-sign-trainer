# Hand Sign Trainer - Visual Reference Guide

## Application Map

```
┌─────────────────────────────────────────────────────────────────┐
│                          LANDING PAGE (/)                       │
│        Choose: Sign In | Create Account (Teacher/Student)       │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
        ┌──────▼──────┐              ┌────────▼────────┐
        │ LOGIN PAGE  │              │ REGISTER PAGE   │
        │ /login      │              │ /register       │
        │ Email+Pass  │              │ Role Selection  │
        └──────┬──────┘              └────────┬────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
                    ┌─────────▼────────┐
                    │  Supabase Auth   │
                    │  (JWT Token)     │
                    └────────┬─────────┘
                             │
                    ┌────────▼────────┐
                    │ MIDDLEWARE      │
                    │ Check Auth      │
                    │ Check Role      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐
   │  TEACHER  │      │  STUDENT   │      │   PUBLIC   │
   │ DASHBOARD │      │ DASHBOARD  │      │   ROUTES   │
   └────┬──────┘      └─────┬──────┘      └────────────┘
        │                   │
   ┌────┴──────────────┐    │
   │                   │    │
┌──▼────┐   ┌────────▼──┐  │
│Manage  │   │ Create    │  │
│Students│   │ Signs     │  │
│ /add   │   │ /new      │  │
└────────┘   └───────────┘  │
                             │
                        ┌────▼──────────┐
                        │ Browse Sings  │
                        │ Filter/Search │
                        └────┬──────────┘
                             │
                        ┌────▼──────────┐
                        │ Practice Mode │
                        │ /practice/:id │
                        └────┬──────────┘
                             │
                        ┌────▼──────────┐
                        │ Save Results  │
                        │ Track Score   │
                        └───────────────┘
```

## Database Schema Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                         │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐                  ┌──────────────────┐         │
│  │     users      │                  │ teacher_profiles │         │
│  ├────────────────┤                  ├──────────────────┤         │
│  │ id (UUID) PK   │─────────┬────────│ id (UUID) PK     │         │
│  │ email          │         │        │ user_id (FK)     │         │
│  │ full_name      │         │        │ bio              │         │
│  │ role (enum)◄───┼─────────┤        │ institution      │         │
│  │ created_at     │         │        │ created_at       │         │
│  └────────────────┘         │        └──────────────────┘         │
│         △                    │                                     │
│         │                    │        ┌──────────────────┐         │
│         └────────────────────┼────────│student_profiles  │         │
│                              │        ├──────────────────┤         │
│                              └────────│ id (UUID) PK     │         │
│                                       │ user_id (FK)────┼─────────┤
│                                       │ teacher_id (FK) │         │
│                                       │ enrolled_date    │         │
│                                       │ created_at       │         │
│                                       └────────┬─────────┘         │
│                                                │                   │
│  ┌────────────────────┐     ┌──────────────────▼────┐             │
│  │  sign_categories   │     │    hand_signs         │             │
│  ├────────────────────┤     ├──────────────────────┤             │
│  │ id (UUID) PK       │     │ id (UUID) PK         │             │
│  │ name               │◄────│ category_id (FK)     │             │
│  │ description        │     │ name                 │             │
│  │ teacher_id (FK)────┼─────├─────────────────┐    │             │
│  │ created_at         │     │ teacher_id (FK) │    │             │
│  └────────────────────┘     │ difficulty      │    │             │
│                             │ description     │    │             │
│                             │ created_at      │    │             │
│                             └────────┬────────┘    │             │
│                                      │             │             │
│                             ┌────────▼──────────────▼───┐          │
│                             │  practice_sessions       │          │
│                             ├──────────────────────────┤          │
│                             │ id (UUID) PK             │          │
│                             │ student_id (FK)──────────┼──┐       │
│                             │ sign_id (FK)─────────────┼──┼───┐   │
│                             │ accuracy_score (0-100)   │  │   │   │
│                             │ attempts                 │  │   │   │
│                             │ best_score               │  │   │   │
│                             │ session_date             │  │   │   │
│                             │ created_at               │  │   │   │
│                             └──────────────────────────┘  │   │   │
│                                                           │   │   │
└───────────────────────────────────────────────────────────┼───┼───┘
                                                            │   │
                                                    ┌───────┘   │
                                                    │ ┌─────────┘
                                                    │ │
                                          (Student) (Sign)
```

## Authentication Flow

```
User Registration
    │
    ▼
┌──────────────────────┐
│ Email + Password     │
│ Full Name + Role     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Supabase Auth.signUp │
│ Create JWT Token     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Create users profile │
│ (id, email, role)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐         ┌─────────────────────┐
│ Create Role Profile  │────────▶│ teacher_profiles OR │
│ (teacher/student)    │         │ student_profiles    │
└──────────┬───────────┘         └─────────────────────┘
           │
           ▼
┌──────────────────────┐
│ Middleware Check     │
│ Redirect to Role     │
│ Dashboard            │
└──────────┬───────────┘
           │
           ▼
    LOGGED IN!
```

## Teacher Workflow

```
┌────────────────────────────────────┐
│  Teacher Dashboard                 │
│  /teacher/dashboard                │
├────────────────────────────────────┤
│ • View Students (count)            │
│ • View Signs (count)               │
│ • Student List (name, email, date) │
│ • Quick Access Buttons             │
└────────┬──────────────┬────────────┘
         │              │
    ┌────▼────┐    ┌────▼──────┐
    │ Add      │    │ Create    │
    │ Student  │    │ Sign      │
    └────┬─────┘    └────┬──────┘
         │               │
    ┌────▼─────────────────▼───┐
    │ Fill Form:                │
    │ • Name/Email/Password    │
    │ • Category (new/select)  │
    │ • Difficulty Level       │
    │ • Description            │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────┐
    │ Submit to Database │
    │ (insert record)    │
    └────┬───────────────┘
         │
    ┌────▼──────────┐
    │ Redirect/Alert │
    │ Success        │
    └────────────────┘
```

## Student Learning Flow

```
┌─────────────────────────────┐
│ Student Dashboard           │
│ /student/dashboard          │
├─────────────────────────────┤
│ Available Signs (category)  │
│ • Hello (Greetings, Easy)   │
│ • Thank You (Greetings, E)  │
│ • Good Bye (Greetings, E)   │
│ • Please (Politeness, M)    │
│ • Help (Emergency, Hard)    │
└────┬────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ Select Sign to Practice  │
│ Click "Practice This..."  │
└────┬─────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Practice Page                    │
│ /student/practice/[signId]       │
├──────────────────────────────────┤
│ ┌──────────────────┐  ┌────────┐ │
│ │ Camera Feed      │  │ Stats  │ │
│ │ (Hand Detection) │  │────────│ │
│ │                  │  │Att: 3  │ │
│ │ Hand Visual      │  │Best: 92%
│ │                  │  │Diff: Med
│ └──────────────────┘  └────────┘ │
│                                  │
│ Start Practice Button            │
│ ▼ (Records practice)             │
│                                  │
│ While Practicing:                │
│ • Hand Detection: ✓ ON           │
│ • Accuracy: 87%                  │
│ • Feedback: "Good! Keep..."      │
│                                  │
│ Stop Practice Button             │
│ ▼ (Saves session)                │
│                                  │
│ ✓ Session Saved!                 │
│ New Best Score: 87%              │
└──────────────────────────────────┘
```

## Real-Time Accuracy Scoring

```
Frame 1: Hand NOT Detected
┌──────────────────────────┐
│ Show Your Hand to Start  │
│ Recognition             │
│ Accuracy: 0%            │
└──────────────────────────┘

Frame 10: Hand Detected - Processing
┌──────────────────────────┐
│ Hand Detected! ✓         │
│ Analyzing position...    │
│ Accuracy: --            │
└──────────────────────────┘

Frame 20: Prediction Made
┌──────────────────────────┐
│ Hand Position: Correct   │
│ Accuracy: 45%           │
│ Feedback: Keep trying!  │
└──────────────────────────┘

Frame 50: Better Position
┌──────────────────────────┐
│ Hand Position: Good!     │
│ Accuracy: 78%           │
│ Feedback: Almost there! │
└──────────────────────────┘

Frame 80: Excellent!
┌──────────────────────────┐
│ Hand Position: Perfect! │
│ Accuracy: 94%           │
│ Feedback: Excellent!    │
└──────────────────────────┘
```

## Page Hierarchy

```
Level 0 (Public)
├── / (Landing Page)
├── /login
└── /register

Level 1 (Protected by Auth)
└── /dashboard (Role Redirect)
    ├── /teacher/dashboard
    │   ├── /teacher/students/add
    │   ├── /teacher/signs
    │   └── /teacher/signs/new
    └── /student/dashboard
        ├── /student/practice/[signId]
        └── /student/progress (future)
```

## Component Structure

```
RootLayout (AuthProvider)
│
├── LandingPage
│
├── AuthLayout
│   ├── LoginPage
│   └── RegisterPage
│
└── AppLayout
    ├── TeacherDashboard
    │   ├── StudentList
    │   ├── SignStats
    │   └── QuickActions
    │
    ├── StudentDashboard
    │   ├── CategoryFilter
    │   └── SignCard (grid)
    │
    ├── AddStudentForm
    │
    ├── CreateSignForm
    │   └── CategorySelector
    │
    └── PracticePage
        ├── CameraFeed
        ├── AccuracyDisplay
        ├── StatsPanel
        └── ControlButtons
```

## Status Indicators

```
Hand Detection Status:
● DETECTED    - Green dot, ready to recognize
○ NOT VISIBLE - Gray dot, show hand

Recording Status:
● RECORDING   - Blue dot, actively practicing
○ IDLE        - Gray dot, not in practice

Accuracy Indicator (Color Coded):
80-100% ■ Green    (Excellent!)
60-79%  ■ Yellow   (Good, keep going)
40-59%  ■ Orange   (Getting closer)
0-39%   ■ Red      (Keep trying)
```

## User Journey Timeline

```
Day 1: Registration
  │ Teacher creates account
  │ Student gets credentials from teacher
  └─ Both login successfully

Day 1-2: Setup
  │ Teacher creates sign categories
  │ Teacher creates hand signs
  │ Teacher adds students
  └─ Teacher invites students to practice

Day 2+: Learning
  │ Student logs in
  │ Student browses available signs
  │ Student selects sign to practice
  │ Student shows hand to camera
  │ System detects hand
  │ ML model predicts sign match
  │ Accuracy score updates in real-time
  │ Student adjusts hand position
  │ Accuracy improves
  │ Student stops practice
  │ Session saved with accuracy score
  │ Best score tracked
  │ Student repeats for different signs
  └─ Teacher monitors progress
```

