import { Suspense } from "react";
import Link from "next/link";
import { getCommonSongs, getDisplayName } from "@/app/(app)/friends/actions";

export default function CommonSongsPage({
  params,
}: {
  params: Promise<{ friendUserId: string }>;
}) {
  return (
    <>
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <CommonSongsContent params={params} />
      </Suspense>
      <Link href="/friends" className="text-sm text-muted-foreground hover:underline">
        ← 友だち一覧に戻る
      </Link>
    </>
  );
}

async function CommonSongsContent({
  params,
}: {
  params: Promise<{ friendUserId: string }>;
}) {
  const { friendUserId } = await params;
  const [songs, displayName] = await Promise.all([
    getCommonSongs(friendUserId),
    getDisplayName(friendUserId),
  ]);

  return (
    <>
      <h1 className="text-2xl font-bold">{displayName}さんとの共通曲</h1>
      <div className="flex flex-col divide-y rounded-lg border shadow-sm">
        {songs.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            共通の曲はまだ見つかりませんでした
          </p>
        )}
        {songs.map((song) => (
          <div key={`${song.title}-${song.artist}`} className="flex items-center gap-3 p-4 text-sm">
            <span className="truncate">{song.title}</span>
            <span className="text-muted-foreground truncate">{song.artist}</span>
          </div>
        ))}
      </div>
    </>
  );
}
