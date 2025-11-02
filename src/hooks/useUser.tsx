"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setIsLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}