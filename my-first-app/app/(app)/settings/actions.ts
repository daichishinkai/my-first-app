"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/auth";

export type VocalRange = {
  user_id: string;
  lowest_note: number;
  highest_note: number;
};

export async function getVocalRange(): Promise<VocalRange | null> {
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("user_vocal_ranges")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function saveVocalRange(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const rawLowest = Number(formData.get("lowest_note"));
  const rawHighest = Number(formData.get("highest_note"));
  const lowestNote = Math.min(rawLowest, rawHighest);
  const highestNote = Math.max(rawLowest, rawHighest);

  const { error } = await supabase
    .from("user_vocal_ranges")
    .upsert({ user_id: userId, lowest_note: lowestNote, highest_note: highestNote });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/settings/vocal-range");
  revalidatePath("/songs/new");
}
