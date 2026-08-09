import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Plus, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSongs, getSongSuggestions } from "@/app/(app)/songs/actions";
import { getSituation } from "@/app/(app)/situations/actions";

export default function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situation?: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">曲一覧</h1>
        <Link
          href="/situations"
          className="text-sm text-muted-foreground hover:underline"
        >
          シチュエーション管理
        </Link>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <SongsContent searchParams={searchParams} />
      </Suspense>

      <Button
        asChild
        size="icon"
        className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-20 size-14 rounded-full shadow-lg"
      >
        <Link href="/songs/new" aria-label="曲を登録する">
          <Plus className="size-6" />
        </Link>
      </Button>
    </div>
  );
}

async function SongsContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situation?: string }>;
}) {
  const { q, situation: situationId } = await searchParams;
  const [songs, suggestions, situation] = await Promise.all([
    getSongs({ query: q, situationId }),
    getSongSuggestions(),
    situationId ? getSituation(situationId) : Promise.resolve(null),
  ]);

  const searchOptions = [
    ...new Set(suggestions.flatMap((s) => [s.title, s.artist])),
  ];

  return (
    <>
      {situation && (
        <div className="flex flex-col gap-2">
          <Link
            href="/protected"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← ホームに戻る
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">絞り込み中:</span>
            <Badge>{situation.name}</Badge>
            <Link href="/songs" className="text-muted-foreground hover:underline">
              解除
            </Link>
          </div>
        </div>
      )}

      <form method="GET" className="flex gap-2">
        <Input
          type="text"
          name="q"
          list="search-suggestions"
          placeholder="曲名・歌手名で検索"
          defaultValue={q}
          autoComplete="off"
        />
        <datalist id="search-suggestions">
          {searchOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <Button type="submit" variant="outline">
          検索
        </Button>
      </form>

      <div className="flex flex-col divide-y rounded-lg border shadow-sm">
        {songs.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            {q
              ? "該当する曲が見つかりませんでした"
              : situation
                ? "このシチュエーションにはまだ曲がありません"
                : "まだ曲が登録されていません"}
          </p>
        )}
        {songs.map((song) => (
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
