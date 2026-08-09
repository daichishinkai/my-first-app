import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getPublicSongs } from "@/app/(app)/songs/actions";

export default function PublicSongsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">公開曲リスト</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <PublicSongsContent params={params} />
      </Suspense>
    </div>
  );
}

async function PublicSongsContent({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const songs = await getPublicSongs(userId);

  return (
    <div className="flex flex-col divide-y rounded-lg border shadow-sm">
      {songs.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">
          公開されている曲はまだありません
        </p>
      )}
      {songs.map((song) => (
        <div
          key={song.id}
          className="flex items-center justify-between gap-3 p-4 text-sm"
        >
          <span className="truncate">
            {song.title}
            <span className="ml-2 text-muted-foreground">{song.artist}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs w-8 text-right">
              {song.key_offset > 0 ? `+${song.key_offset}` : song.key_offset}
            </span>
            {song.needs_check && (
              <Badge variant="outline" className="px-1.5">
                要
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {song.satisfaction}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
