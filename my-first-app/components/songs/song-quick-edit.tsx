"use client";

import { useState } from "react";
import { AlertCircle, Music2, StickyNote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { Song } from "@/app/(app)/songs/actions";

type SongQuickEditProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialValues: Pick<Song, "key_offset" | "needs_check" | "satisfaction" | "memo">;
};

export function SongQuickEdit({ action, initialValues }: SongQuickEditProps) {
  const [keyOffset, setKeyOffset] = useState(initialValues.key_offset);
  const [satisfaction, setSatisfaction] = useState(initialValues.satisfaction);

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2">
          <Music2 className="size-4 text-primary" />
          キー
        </Label>
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
          id="quick_needs_check"
          name="needs_check"
          defaultChecked={initialValues.needs_check}
        />
        <Label htmlFor="quick_needs_check" className="flex items-center gap-2">
          <AlertCircle className="size-4 text-primary" />
          要確認
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2">
          <Star className="size-4 text-primary" />
          満足度
        </Label>
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
        <Label htmlFor="quick_memo" className="flex items-center gap-2">
          <StickyNote className="size-4 text-primary" />
          メモ
        </Label>
        <Textarea
          id="quick_memo"
          name="memo"
          defaultValue={initialValues.memo}
          placeholder="歌い方のコツ、間奏の長さなど自由に"
        />
      </div>

      <Button type="submit" variant="outline" className="self-start">
        保存
      </Button>
    </form>
  );
}
