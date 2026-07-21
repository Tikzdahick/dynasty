"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { getGuestName, setGuestName as persistGuest } from "@/lib/store/local";
import { ensureHydrated, logSignup } from "@/lib/store/cloud";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
  guestName: string;
  displayName: string;
  setGuestName: (n: string) => void;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName?: string) => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestNameState] = useState("");

  useEffect(() => {
    setGuestNameState(getGuestName());
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
      if (data.user) {
        ensureHydrated(); // pull account data into the local cache
        logSignup(); // once-per-device IP/fingerprint report (dup-account flagging)
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureHydrated();
        logSignup();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const setGuestName = useCallback((n: string) => {
    persistGuest(n);
    setGuestNameState(n);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Auth is not configured. Play as guest instead.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Auth is not configured. Play as guest instead.";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // read by the handle_new_user() DB trigger to fill profiles.display_name
        data: { display_name: displayName?.trim() || email.split("@")[0] },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    return error ? error.message : null;
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Auth is not configured. Play as guest instead.";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    return error ? error.message : null;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return "Auth is not configured. Play as guest instead.";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    guestName ||
    "Guest";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isSupabaseConfigured,
        guestName,
        displayName,
        setGuestName,
        signInWithPassword,
        signUp,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
