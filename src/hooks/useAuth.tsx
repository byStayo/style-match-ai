import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface UserPreferences {
  colors?: string[];
  styles?: string[];
  sizes?: string[];
  [key: string]: any;
}

export interface UserData {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  preferences: UserPreferences;
  uploads: string[];
  favorites: string[];
  subscription_status?: string;
  subscription_tier?: string;
  openai_api_key?: string;
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
      console.log("Fetching user data for:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const preferences = data.preferences as UserPreferences || {};
        console.log("Loaded user preferences:", preferences);

        setUserData({
          id: userId,
          email: user?.email,
          displayName: data.full_name,
          photoURL: data.avatar_url,
          preferences: preferences,
          uploads: [],  // We'll fetch these separately if needed
          favorites: [], // We'll fetch these separately if needed
          connectedAccounts: {}, // We'll fetch these separately if needed
          subscription_status: data.subscription_status,
          subscription_tier: data.subscription_tier,
          openai_api_key: data.openai_api_key
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  return { user, userData, loading };
};