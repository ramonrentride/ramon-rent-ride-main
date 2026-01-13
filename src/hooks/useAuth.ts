import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'mechanic';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  displayName: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    displayName: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Keep isLoading true while we fetch role/profile
        if (session?.user) {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
            isAuthenticated: true,
            isLoading: true, // Stay loading until role is fetched
          }));
          // Fetch role and profile after auth state changes
          setTimeout(() => {
            fetchUserRoleAndProfile(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            session: null,
            user: null,
            isAuthenticated: false,
            role: null,
            displayName: null,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session.user,
          isAuthenticated: true,
          isLoading: true, // Stay loading until role is fetched
        }));
        fetchUserRoleAndProfile(session.user.id);
      } else {
        setAuthState(prev => ({
          ...prev,
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoleAndProfile = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle();

      setAuthState(prev => ({
        ...prev,
        role: roleData?.role as AppRole | null,
        displayName: profileData?.display_name ?? null,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching user role/profile:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });

    if (!error && data.user) {
      // Create profile for the new user
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        display_name: displayName,
      });
    }

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const isAdmin = authState.role === 'admin';
  const isMechanic = authState.role === 'mechanic';
  const isStaff = isAdmin || isMechanic;

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isMechanic,
    isStaff,
  };
}
