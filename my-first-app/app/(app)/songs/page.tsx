import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SongList } from "@/components/songs/song-list";
import { requireUserId } from "@/lib/supabase/auth";
import { getSituation } from "@/app/(app)/situations/actions";

export default function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ situation?: string }>;
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
  searchParams: Promise<{ situation?: string }>;
}) {
  const { situation: situationId } = await searchParams;
  const { userId } = await requireUserId();
  const situation = situationId ? await getSituation(situationId) : null;

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

      <SongList userId={userId} situationId={situationId} />
    </>
  );
}
