'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserRole, UserProfile } from './supabase';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (u: User) => {
    // First try from user_metadata (fast, no DB call needed)
    const metaRole = u.user_metadata?.role as UserRole | undefined;
    if (metaRole) setRole(metaRole);

    try {
      const { data } = await supabase.from('users').select('*').eq('id', u.id).single();
      if (data) {
        setUserProfile(data as UserProfile);
        setRole(data.role as UserRole);
      }
    } catch {}
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user);
      } else {
        setUser(null); setUserProfile(null); setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data: { user: newUser }, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) throw error;
    if (!newUser) throw new Error('User creation failed');

    // Upsert profile
    await supabase.from('users').upsert({ id: newUser.id, email, full_name: fullName, role });
    setUser(newUser);
    setRole(role);
  };

  const signIn = async (email: string, password: string) => {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (user) {
      setUser(user);
      await loadUserProfile(user);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setUserProfile(null); setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, role, loading, signUp, signIn, signOut, isTeacher: role === 'teacher', isStudent: role === 'student' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
