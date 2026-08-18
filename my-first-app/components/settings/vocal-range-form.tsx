"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NoteSelect } from "@/components/music/note-select";
import { DEFAULT_NOTE_SEMITONE, formatNote } from "@/lib/music/notes";
import type { VocalRange } from "@/app/(app)/settings/actions";

type VocalRangeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialValues: Pick<VocalRange, "lowest_note" | "highest_note"> | null;
};

export function VocalRangeForm({ action, initialValues }: VocalRangeFormProps) {
  const [lowest, setLowest] = useState(
    initialValues?.lowest_note ?? DEFAULT_NOTE_SEMITONE - 12,
  );
  const [highest, setHighest] = useState(
    initialValues?.highest_note ?? DEFAULT_NOTE_SEMITONE + 12,
  );

  return (
    <form action={action} className="flex flex-col gap-6 max-w-md">
      <div className="flex flex-col gap-2">
        <Label>最低音（無理なく出せる低い方の音）</Label>
        <NoteSelect idPrefix="lowest" value={lowest} onChange={setLowest} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>最高音（無理なく出せる高い方の音）</Label>
        <NoteSelect idPrefix="highest" value={highest} onChange={setHighest} />
      </div>

      <p className="text-sm text-muted-foreground">
        現在の設定: {formatNote(lowest)} 〜 {formatNote(highest)}
      </p>

      <input type="hidden" name="lowest_note" value={lowest} />
      <input type="hidden" name="highest_note" value={highest} />

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "保存中..." : "保存する"}
    </Button>
  );
}
