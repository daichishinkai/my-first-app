import { Suspense } from "react";
import { SongForm } from "@/components/songs/song-form";
import { createSong, getSongSuggestions } from "@/app/(app)/songs/actions";
import { getSituations } from "@/app/(app)/situations/actions";

export default function NewSongPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">曲を登録する</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <NewSongFormContent />
      </Suspense>
    </>
  );
}

async function NewSongFormContent() {
  const [suggestions, allSituations] = await Promise.all([
    getSongSuggestions(),
    getSituations(),
  ]);

  return (
    <SongForm
      mode="create"
      action={createSong}
      suggestions={suggestions}
      allSituations={allSituations}
    />
  );
}
