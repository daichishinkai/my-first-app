"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Song } from "@/app/(app)/songs/actions";
import { createClient } from "@/lib/supabase/client";
import {
  getCachedSongs,
  setCachedSongs,
  type SongSituationLink,
} from "@/lib/songs-cache";

type SongListProps = {
  userId: string;
  situationId?: string;
};

export function SongList({ userId, situationId }: SongListProps) {
  const [songs, setSongs] = useState<Song[]>(
    () => getCachedSongs(userId)?.songs ?? [],
  );
  const [songSituations, setSongSituations] = useState<SongSituationLink[]>(
    () => getCachedSongs(userId)?.songSituations ?? [],
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function refresh() {
      const [songsResult, songSituationsResult] = await Promise.all([
        supabase
          .from("songs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("song_situations").select("song_id, situation_id"),
      ]);

      if (cancelled) {
        return;
      }

      if (songsResult.error || songSituationsResult.error) {
        return;
      }

      setSongs(songsResult.data);
      setSongSituations(songSituationsResult.data);
      setCachedSongs(userId, {
        songs: songsResult.data,
        songSituations: songSituationsResult.data,
      });
    }

    refresh();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const searchOptions = useMemo(
    () => [...new Set(songs.flatMap((s) => [s.title, s.artist]))],
    [songs],
  );

  const visibleSongs = useMemo(() => {
    let result = songs;

    if (situationId) {
      const songIds = new Set(
        songSituations
          .filter((link) => link.situation_id === situationId)
          .map((link) => link.song_id),
      );
      result = result.filter((song) => songIds.has(song.id));
    }

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (song) =>
          song.title.toLowerCase().includes(q) ||
          song.artist.toLowerCase().includes(q),
      );
    }

    return result;
  }, [songs, songSituations, situationId, query]);

  return (
    <>
      <div className="flex gap-2">
        <Input
          type="text"
          list="search-suggestions"
          placeholder="曲名・歌手名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <datalist id="search-suggestions">
          {searchOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col divide-y rounded-lg border shadow-sm">
        {visibleSongs.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            {query
              ? "該当する曲が見つかりませんでした"
              : situationId
                ? "このシチュエーションにはまだ曲がありません"
                : "まだ曲が登録されていません"}
          </p>
        )}
        {visibleSongs.map((song) => (
          <Link
            key={song.id}
            href={`/songs/${song.id}`}
            className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-accent"
          >
            <span className="truncate">{song.title}</span>
            <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
              <span className="font-mono text-xs w-8 text-right text-foreground">
                {song.key_offset > 0
                  ? `+${song.key_offset}`
                  : song.key_offset}
              </span>
              {song.needs_check && (
                <AlertCircle className="size-4 text-primary" />
              )}
              <span className="flex items-center gap-0.5 text-xs">
                <Star className="size-3.5 fill-current" />
                {song.satisfaction}
              </span>
              <ChevronRight className="size-4" />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
