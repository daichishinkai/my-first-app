"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/auth";

export type Song = {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  key_offset: number;
  needs_check: boolean;
  satisfaction: number;
  is_public: boolean;
  memo: string;
  original_lowest_note: number | null;
  original_highest_note: number | null;
  created_at: string;
  updated_at: string;
};

export async function getSongSuggestions(): Promise<
  { title: string; artist: string }[]
> {
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("songs")
    .select("title, artist")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSong(id: string): Promise<Song | null> {
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPublicSongs(userId: string): Promise<Song[]> {
  const { supabase } = await requireUserId();

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSongSituationIds(songId: string): Promise<string[]> {
  const { supabase } = await requireUserId();

  const { data, error } = await supabase
    .from("song_situations")
    .select("situation_id")
    .eq("song_id", songId);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => row.situation_id);
}

async function syncSongSituations(
  supabase: Awaited<ReturnType<typeof requireUserId>>["supabase"],
  songId: string,
  situationIds: string[],
) {
  const { error: deleteError } = await supabase
    .from("song_situations")
    .delete()
    .eq("song_id", songId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (situationIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("song_situations").insert(
    situationIds.map((situationId) => ({
      song_id: songId,
      situation_id: situationId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function readSongFormData(formData: FormData) {
  const originalLowestRaw = formData.get("original_lowest_note");
  const originalHighestRaw = formData.get("original_highest_note");
  const originalLowestNote =
    originalLowestRaw === null || originalLowestRaw === ""
      ? null
      : Number(originalLowestRaw);
  const originalHighestNote =
    originalHighestRaw === null || originalHighestRaw === ""
      ? null
      : Number(originalHighestRaw);

  return {
    title: String(formData.get("title") ?? "").trim(),
    artist: String(formData.get("artist") ?? "").trim(),
    key_offset: Number(formData.get("key_offset") ?? 0),
    needs_check: formData.get("needs_check") === "on",
    satisfaction: Number(formData.get("satisfaction") ?? 3),
    is_public: formData.get("is_public") === "on",
    memo: String(formData.get("memo") ?? "").trim(),
    original_lowest_note: originalLowestNote,
    original_highest_note: originalHighestNote,
  };
}

export async function createSong(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const fields = readSongFormData(formData);
  const situationIds = formData.getAll("situation_ids").map(String);

  const { data, error } = await supabase
    .from("songs")
    .insert({ ...fields, user_id: userId })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncSongSituations(supabase, data.id, situationIds);

  revalidatePath("/songs");
  redirect("/protected");
}

export async function updateSong(id: string, formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const fields = readSongFormData(formData);
  const situationIds = formData.getAll("situation_ids").map(String);

  const { error } = await supabase
    .from("songs")
    .update(fields)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await syncSongSituations(supabase, id, situationIds);

  revalidatePath("/songs");
  revalidatePath(`/songs/${id}`);
  redirect(`/songs/${id}`);
}

export async function updateSongQuickFields(id: string, formData: FormData) {
  const { supabase, userId } = await requireUserId();

  const fields = {
    key_offset: Number(formData.get("key_offset") ?? 0),
    needs_check: formData.get("needs_check") === "on",
    satisfaction: Number(formData.get("satisfaction") ?? 3),
    memo: String(formData.get("memo") ?? "").trim(),
  };

  const { error } = await supabase
    .from("songs")
    .update(fields)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/songs/${id}`);
  revalidatePath("/songs");
}

export async function deleteSong(id: string) {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("songs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/songs");
  redirect("/songs");
}
