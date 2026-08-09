"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Song } from "@/app/(app)/songs/actions";
import type { Situation } from "@/app/(app)/situations/actions";
import { createSituationInline } from "@/app/(app)/situations/actions";

type SongFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  suggestions: { title: string; artist: string }[];
  allSituations: Situation[];
  selectedSituationIds?: string[];
  initialValues?: Pick<
    Song,
    | "title"
    | "artist"
    | "key_offset"
    | "needs_check"
    | "satisfaction"
    | "is_public"
    | "memo"
  >;
};

export function SongForm({
  mode,
  action,
  suggestions,
  allSituations,
  selectedSituationIds,
  initialValues,
}: SongFormProps) {
  const [keyOffset, setKeyOffset] = useState(initialValues?.key_offset ?? 0);
  const [satisfaction, setSatisfaction] = useState(
    initialValues?.satisfaction ?? 3,
  );
  const [situations, setSituations] = useState(allSituations);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedSituationIds ?? [],
  );
  const [newSituationName, setNewSituationName] = useState("");
  const [isAddingSituation, setIsAddingSituation] = useState(false);

  const toggleSituation = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleAddSituation = async () => {
    const name = newSituationName.trim();
    if (!name) return;

    setIsAddingSituation(true);
    try {
      const created = await createSituationInline(name);
      setSituations((prev) => [...prev, created]);
      setSelectedIds((prev) => [...prev, created.id]);
      setNewSituationName("");
    } finally {
      setIsAddingSituation(false);
    }
  };

  const titleOptions = [...new Set(suggestions.map((s) => s.title))];
  const artistOptions = [...new Set(suggestions.map((s) => s.artist))];

  return (
    <form action={action} className="flex flex-col gap-6 max-w-md">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">曲名</Label>
        <Input
          id="title"
          name="title"
          list="title-suggestions"
          defaultValue={initialValues?.title}
          required
          autoComplete="off"
        />
        <datalist id="title-suggestions">
          {titleOptions.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="artist">歌手名</Label>
        <Input
          id="artist"
          name="artist"
          list="artist-suggestions"
          defaultValue={initialValues?.artist}
          required
          autoComplete="off"
        />
        <datalist id="artist-suggestions">
          {artistOptions.map((artist) => (
            <option key={artist} value={artist} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <Label>キー</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setKeyOffset((k) => k - 1)}
          >
            −
          </Button>
          <span className="w-10 text-center font-mono">
            {keyOffset > 0 ? `+${keyOffset}` : keyOffset}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setKeyOffset((k) => k + 1)}
          >
            ＋
          </Button>
        </div>
        <input type="hidden" name="key_offset" value={keyOffset} />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="needs_check"
          name="needs_check"
          defaultChecked={initialValues?.needs_check}
        />
        <Label htmlFor="needs_check">要確認</Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is_public"
          name="is_public"
          defaultChecked={initialValues?.is_public}
        />
        <Label htmlFor="is_public">公開する</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label>満足度</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              type="button"
              variant={satisfaction === n ? "default" : "outline"}
              size="icon"
              onClick={() => setSatisfaction(n)}
            >
              {n}
            </Button>
          ))}
        </div>
        <input type="hidden" name="satisfaction" value={satisfaction} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="memo">メモ</Label>
        <Textarea
          id="memo"
          name="memo"
          defaultValue={initialValues?.memo}
          placeholder="歌い方のコツ、間奏の長さなど自由に"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>シチュエーション</Label>
        <div className="flex flex-wrap gap-2">
          {situations.map((situation) => (
            <Button
              key={situation.id}
              type="button"
              size="sm"
              variant={selectedIds.includes(situation.id) ? "default" : "outline"}
              onClick={() => toggleSituation(situation.id)}
            >
              {situation.name}
            </Button>
          ))}
        </div>
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name="situation_ids" value={id} />
        ))}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="＋新規シチュエーション追加"
            value={newSituationName}
            onChange={(e) => setNewSituationName(e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isAddingSituation || !newSituationName.trim()}
            onClick={handleAddSituation}
          >
            追加
          </Button>
        </div>
      </div>

      <Button type="submit">
        {mode === "create" ? "登録する" : "更新する"}
      </Button>
    </form>
  );
}
