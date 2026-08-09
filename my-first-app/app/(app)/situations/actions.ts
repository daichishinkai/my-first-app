"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/auth";

export type Situation = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export async function getSituations(): Promise<Situation[]> {
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("situations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSituation(id: string): Promise<Situation | null> {
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("situations")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createSituation(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return;
  }

  const { error } = await supabase
    .from("situations")
    .insert({ user_id: userId, name });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/situations");
}

export async function createSituationInline(name: string): Promise<Situation> {
  const { supabase, userId } = await requireUserId();
  const trimmedName = name.trim();

  const { data, error } = await supabase
    .from("situations")
    .insert({ user_id: userId, name: trimmedName })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/situations");
  return data;
}

export async function updateSituation(id: string, formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return;
  }

  const { error } = await supabase
    .from("situations")
    .update({ name })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/situations");
}

export async function deleteSituation(id: string) {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("situations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/situations");
  revalidatePath("/songs");
}
