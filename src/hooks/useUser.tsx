"use client";

import { useSession, useUser as useSupabaseUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;

export function useUser() {
  const session = useSession();
  const supabaseUser = useSupabaseUser();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (supabaseUser && !profile) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (error) throw error;
          setProfile(data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        } finally {
          setIsLoading(false);
        }
      } else if (!supabaseUser) {
        setProfile(null);
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [supabaseUser, profile]);

  return {
    session,
    isLoading,
    user: supabaseUser,
    profile,
  };
}