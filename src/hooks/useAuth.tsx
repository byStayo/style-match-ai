import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import type { UserData } from "@/types/auth";

type Profile = Database['public']['Tables']['profiles']['Row'];

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
          id: userId,
          email: user?.email,
          displayName: data.full_name,
          photoURL: data.avatar_url,
          preferences: data.preferences as UserData['preferences'] || {},
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