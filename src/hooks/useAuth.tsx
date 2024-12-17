import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface UserData {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider?: string;
  isAnonymous?: boolean;
  preferences: Record<string, any>;
  uploads: string[];
  favorites: string[];
  connectedAccounts?: {
    instagram?: {
      connected: boolean;
      lastSync: string;
    };
    facebook?: {
      connected: boolean;
      lastSync: string;
    };
    tiktok?: {
      connected: boolean;
      lastSync: string;
    };
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUserData({
          email: user?.email,
          displayName: data.full_name,
          photoURL: data.avatar_url,
          preferences: data.preferences,
          uploads: [],  // We'll fetch these separately if needed
          favorites: [], // We'll fetch these separately if needed
          connectedAccounts: {} // We'll fetch these separately if needed
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  return { user, userData, loading };
};