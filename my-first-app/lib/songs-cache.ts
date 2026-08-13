import type { Song } from "@/app/(app)/songs/actions";

export type SongSituationLink = {
  song_id: string;
  situation_id: string;
};

export type SongsCache = {
  songs: Song[];
  songSituations: SongSituationLink[];
  cachedAt: number;
};

function cacheKey(userId: string) {
  return `songs-cache:${userId}`;
}

export function getCachedSongs(userId: string): SongsCache | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SongsCache;
  } catch {
    return null;
  }
}

export function setCachedSongs(
  userId: string,
  data: Pick<SongsCache, "songs" | "songSituations">,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const cache: SongsCache = { ...data, cachedAt: Date.now() };
    window.localStorage.setItem(cacheKey(userId), JSON.stringify(cache));
  } catch {
    // localStorageが使えない環境(プライベートモード等)では黙って諦める
  }
}
