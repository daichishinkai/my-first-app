"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Song } from "@/app/(app)/songs/actions";
import type { Situation } from "@/app/(app)/situations/actions";
import type { VocalRange } from "@/app/(app)/settings/actions";
import { createSituationInline } from "@/app/(app)/situations/actions";
import { OcrCapture } from "@/components/songs/ocr-capture";
import { NoteSelect } from "@/components/music/note-select";
import { DEFAULT_NOTE_SEMITONE, formatNote, suggestKeyOffset } from "@/lib/music/notes";

type ExternalSuggestion = {
  title: string;
  artist: string;
};

const EXTERNAL_MIN_QUERY_LENGTH = 2;
const EXTERNAL_DEBOUNCE_MS = 500;

type SongFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  suggestions: { title: string; artist: string }[];
  allSituations: Situation[];
  selectedSituationIds?: string[];
  vocalRange: Pick<VocalRange, "lowest_note" | "highest_note"> | null;
  initialValues?: Pick<
    Song,
    | "title"
    | "artist"
    | "key_offset"
    | "needs_check"
    | "satisfaction"
    | "is_public"
    | "memo"
    | "original_lowest_note"
    | "original_highest_note"
  >;
};

export function SongForm({
  mode,
  action,
  suggestions,
  allSituations,
  selectedSituationIds,
  vocalRange,
  initialValues,
}: SongFormProps) {
  const [keyOffset, setKeyOffset] = useState(initialValues?.key_offset ?? 0);
  const [hasOriginalRange, setHasOriginalRange] = useState(
    initialValues?.original_lowest_note != null,
  );
  const [originalLowest, setOriginalLowest] = useState(
    initialValues?.original_lowest_note ?? DEFAULT_NOTE_SEMITONE - 12,
  );
  const [originalHighest, setOriginalHighest] = useState(
    initialValues?.original_highest_note ?? DEFAULT_NOTE_SEMITONE + 12,
  );
  const keySuggestion =
    hasOriginalRange && vocalRange
      ? suggestKeyOffset(
          vocalRange.lowest_note,
          vocalRange.highest_note,
          originalLowest,
          originalHighest,
        )
      : null;
  const [satisfaction, setSatisfaction] = useState(
    initialValues?.satisfaction ?? 3,
  );
  const [situations, setSituations] = useState(allSituations);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedSituationIds ?? [],
  );
  const [newSituationName, setNewSituationName] = useState("");
  const [isAddingSituation, setIsAddingSituation] = useState(false);

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [artist, setArtist] = useState(initialValues?.artist ?? "");
  const [externalResults, setExternalResults] = useState<ExternalSuggestion[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalSearched, setExternalSearched] = useState(false);
  const [showSuggestDropdown, setShowSuggestDropdown] = useState(false);

  useEffect(() => {
    if (!showSuggestDropdown) {
      return;
    }

    const trimmed = title.trim();
    if (trimmed.length < EXTERNAL_MIN_QUERY_LENGTH) {
      setExternalResults([]);
      setExternalSearched(false);
      setExternalLoading(false);
      return;
    }

    setExternalLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [mbRes, vocadbRes] = await Promise.allSettled([
          fetch(`/api/musicbrainz/search?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          }).then((res) => res.json()),
          fetch(`/api/vocadb/search?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          }).then((res) => res.json()),
        ]);

        const seen = new Set<string>();
        const merged: ExternalSuggestion[] = [];
        for (const settled of [mbRes, vocadbRes]) {
          if (settled.status !== "fulfilled") continue;
          const results = settled.value?.results;
          if (!Array.isArray(results)) continue;
          for (const suggestion of results as ExternalSuggestion[]) {
            const key = `${suggestion.title}::${suggestion.artist}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(suggestion);
          }
        }
        setExternalResults(merged);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setExternalResults([]);
        }
      } finally {
        setExternalLoading(false);
        setExternalSearched(true);
      }
    }, EXTERNAL_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [title, showSuggestDropdown]);

  const handleSelectSuggestion = (suggestion: ExternalSuggestion) => {
    setTitle(suggestion.title);
    setArtist(suggestion.artist);
    setShowSuggestDropdown(false);
    setExternalResults([]);
    setExternalSearched(false);
  };

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
      {mode === "create" && (
        <OcrCapture
          onResult={(result) => {
            if (result.title) setTitle(result.title);
            if (result.artist) setArtist(result.artist);
          }}
        />
      )}

      <div className="relative flex flex-col gap-2">
        <Label htmlFor="title">曲名</Label>
        <Input
          id="title"
          name="title"
          list="title-suggestions"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setShowSuggestDropdown(true);
          }}
          onFocus={() => setShowSuggestDropdown(true)}
          onBlur={() => setShowSuggestDropdown(false)}
          required
          autoComplete="off"
        />
        <datalist id="title-suggestions">
          {titleOptions.map((titleOption) => (
            <option key={titleOption} value={titleOption} />
          ))}
        </datalist>
        {showSuggestDropdown && title.trim().length >= EXTERNAL_MIN_QUERY_LENGTH && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            {externalLoading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                検索中...
              </p>
            ) : externalResults.length > 0 ? (
              <ul>
                {externalResults.map((suggestion, index) => (
                  <li key={`${suggestion.title}-${suggestion.artist}-${index}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent active:bg-accent"
                    >
                      <span className="font-medium">{suggestion.title}</span>
                      <span className="ml-1 text-muted-foreground">
                        - {suggestion.artist}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : externalSearched ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                候補がありません
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="artist">歌手名</Label>
        <Input
          id="artist"
          name="artist"
          list="artist-suggestions"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
          autoComplete="off"
        />
        <datalist id="artist-suggestions">
          {artistOptions.map((artistOption) => (
            <option key={artistOption} value={artistOption} />
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

      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="has_original_range"
            checked={hasOriginalRange}
            onCheckedChange={(checked) => setHasOriginalRange(checked === true)}
          />
          <Label htmlFor="has_original_range">原曲の音域がわかる</Label>
        </div>

        {hasOriginalRange && (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-2">
              <Label>原曲の最低音</Label>
              <NoteSelect
                idPrefix="original-lowest"
                value={originalLowest}
                onChange={setOriginalLowest}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>原曲の最高音</Label>
              <NoteSelect
                idPrefix="original-highest"
                value={originalHighest}
                onChange={setOriginalHighest}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              入力中の原曲音域: {formatNote(originalLowest)} 〜 {formatNote(originalHighest)}
            </p>

            {vocalRange ? (
              keySuggestion && (
                <div className="flex flex-col gap-1.5 rounded-md bg-accent p-3 text-sm">
                  <p>
                    おすすめキー:{" "}
                    <span className="font-mono font-bold">
                      {keySuggestion.offset > 0
                        ? `+${keySuggestion.offset}`
                        : keySuggestion.offset}
                    </span>
                    {keySuggestion.fitsPerfectly
                      ? "（声域にぴったり収まります）"
                      : `（${[
                          keySuggestion.overflowHigh > 0
                            ? `高音側が${keySuggestion.overflowHigh}半音届かない`
                            : null,
                          keySuggestion.overflowLow > 0
                            ? `低音側が${keySuggestion.overflowLow}半音出せない`
                            : null,
                        ]
                          .filter(Boolean)
                          .join("・")}見込みです）`}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setKeyOffset(keySuggestion.offset)}
                  >
                    このキーを設定する
                  </Button>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                声域を登録すると、この曲のおすすめキーが表示されます（
                <a href="/settings/vocal-range" className="underline">
                  声域設定へ
                </a>
                ）
              </p>
            )}
          </div>
        )}

        <input
          type="hidden"
          name="original_lowest_note"
          value={hasOriginalRange ? originalLowest : ""}
        />
        <input
          type="hidden"
          name="original_highest_note"
          value={hasOriginalRange ? originalHighest : ""}
        />
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

      <SubmitButton
        label={mode === "create" ? "登録する" : "更新する"}
        pendingLabel={mode === "create" ? "登録中..." : "更新中..."}
      />
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  );
}
