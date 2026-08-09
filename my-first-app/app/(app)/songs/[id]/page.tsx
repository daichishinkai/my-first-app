import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SongQuickEdit } from "@/components/songs/song-quick-edit";
import { getSong, deleteSong, updateSongQuickFields } from "@/app/(app)/songs/actions";

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <SongDetailContent params={params} />
      </Suspense>
    </div>
  );
}

async function SongDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    notFound();
  }

  const deleteSongWithId = deleteSong.bind(null, id);
  const updateQuickFieldsWithId = updateSongQuickFields.bind(null, id);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">{song.title}</h1>
        <p className="text-muted-foreground">{song.artist}</p>
      </div>

      <div className="rounded-lg border p-4 shadow-sm">
        <SongQuickEdit action={updateQuickFieldsWithId} initialValues={song} />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/songs/${song.id}/edit`}>編集する</Link>
        </Button>
        <form action={deleteSongWithId}>
          <Button type="submit" variant="destructive">
            削除する
          </Button>
        </form>
      </div>

      <Link href="/songs" className="text-sm text-muted-foreground hover:underline">
        ← 曲一覧に戻る
      </Link>
    </>
  );
}
