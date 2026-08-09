"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/auth";

export type FriendRequest = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted";
  created_at: string;
};

export type CommonSong = {
  title: string;
  artist: string;
};

export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getFriends(): Promise<
  { requestId: string; friendUserId: string }[]
> {
  const { supabase, userId } = await requireUserId();

  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("status", "accepted")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => ({
    requestId: row.id,
    friendUserId: row.from_user_id === userId ? row.to_user_id : row.from_user_id,
  }));
}

function parseUserId(input: string): string {
  const trimmed = input.trim();
  const parts = trimmed.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

export async function sendFriendRequest(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const targetUserId = parseUserId(String(formData.get("user_id") ?? ""));

  if (!targetUserId || targetUserId === userId) {
    return;
  }

  const { data: reverseRequest, error: reverseError } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("from_user_id", targetUserId)
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (reverseError) {
    throw new Error(reverseError.message);
  }

  if (reverseRequest) {
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", reverseRequest.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("friend_requests")
      .insert({ from_user_id: userId, to_user_id: targetUserId });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/friends");
}

export async function acceptFriendRequest(id: string) {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", id)
    .eq("to_user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/friends");
}

export async function removeFriendRequest(id: string) {
  const { supabase, userId } = await requireUserId();

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", id)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/friends");
}

export async function getDisplayName(userId: string): Promise<string> {
  const { supabase } = await requireUserId();

  const { data, error } = await supabase.rpc("get_display_name", {
    target_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? userId;
}

export async function getCommonSongs(
  friendUserId: string,
): Promise<CommonSong[]> {
  const { supabase } = await requireUserId();

  const { data, error } = await supabase.rpc("get_common_songs", {
    friend_id: friendUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
