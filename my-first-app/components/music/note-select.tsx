"use client";

import {
  MAX_OCTAVE,
  MIN_OCTAVE,
  NOTE_NAMES,
  fromSemitone,
  toSemitone,
} from "@/lib/music/notes";

type NoteSelectProps = {
  idPrefix: string;
  value: number;
  onChange: (value: number) => void;
};

const OCTAVES = Array.from(
  { length: MAX_OCTAVE - MIN_OCTAVE + 1 },
  (_, i) => MIN_OCTAVE + i,
);

const selectClassName =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function NoteSelect({ idPrefix, value, onChange }: NoteSelectProps) {
  const { noteIndex, octave } = fromSemitone(value);

  return (
    <div className="flex gap-2">
      <select
        id={`${idPrefix}-note`}
        className={selectClassName}
        value={noteIndex}
        onChange={(e) => onChange(toSemitone(Number(e.target.value), octave))}
      >
        {NOTE_NAMES.map((name, index) => (
          <option key={name} value={index}>
            {name}
          </option>
        ))}
      </select>
      <select
        id={`${idPrefix}-octave`}
        className={selectClassName}
        value={octave}
        onChange={(e) => onChange(toSemitone(noteIndex, Number(e.target.value)))}
      >
        {OCTAVES.map((oct) => (
          <option key={oct} value={oct}>
            {oct}
          </option>
        ))}
      </select>
    </div>
  );
}
