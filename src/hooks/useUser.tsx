"use client";

import { useFirebaseAuth } from "@/providers/FirebaseAuthProvider";

export function useUser() {
  const { user, isLoading } = useFirebaseAuth();
  return { user, isLoading };
}