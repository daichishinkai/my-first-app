import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SongForm } from "@/components/songs/song-form";
import {
  getSong,
  getSongSituationIds,
  getSongSuggestions,
  updateSong,
} from "@/app/(app)/songs/actions";
import { getSituations } from "@/app/(app)/situations/actions";
import { getVocalRange } from "@/app/(app)/settings/actions";

export default function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold">曲を編集する</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <EditSongFormContent params={params} />
      </Suspense>
    </>
  );
}

async function EditSongFormContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [song, suggestions, allSituations, selectedSituationIds, vocalRange] =
    await Promise.all([
      getSong(id),
      getSongSuggestions(),
      getSituations(),
      getSongSituationIds(id),
      getVocalRange(),
    ]);

  if (!song) {
    notFound();
  }

  const updateSongWithId = updateSong.bind(null, id);

  return (
    <SongForm
      mode="edit"
      action={updateSongWithId}
      suggestions={suggestions}
      allSituations={allSituations}
      selectedSituationIds={selectedSituationIds}
      vocalRange={vocalRange}
      initialValues={song}
    />
  );
}
