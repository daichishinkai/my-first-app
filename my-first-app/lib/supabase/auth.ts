import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const isAnonymous = data?.claims?.is_anonymous === true;

  if (error || !userId) {
    redirect("/auth/login");
  }

  return { supabase, userId, isAnonymous };
}
