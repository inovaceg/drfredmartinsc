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
    console.log("useUser: useEffect triggered. supabaseUser:", supabaseUser ? supabaseUser.id : "null", "current profile:", profile ? profile.id : "null");
    async function fetchProfile() {
      if (supabaseUser && !profile) {
        console.log("useUser: Fetching profile for user:", supabaseUser.id);
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (error) throw error;
          setProfile(data);
          console.log("useUser: Profile fetched successfully:", data);
        } catch (error) {
          console.error("useUser: Error fetching user profile:", error);
          setProfile(null);
        } finally {
          setIsLoading(false);
          console.log("useUser: Profile fetch finished. isLoading set to false.");
        }
      } else if (!supabaseUser) {
        console.log("useUser: No supabaseUser found. Resetting profile.");
        setProfile(null);
        setIsLoading(false);
      } else if (supabaseUser && profile) {
        console.log("useUser: supabaseUser and profile already exist. Not refetching.");
        setIsLoading(false); // Ensure isLoading is false if already loaded
      }
    }

    fetchProfile();
  }, [supabaseUser, profile]); // Depend on supabaseUser and profile to avoid infinite loops

  return {
    session,
    isLoading,
    user: supabaseUser,
    profile,
  };
}