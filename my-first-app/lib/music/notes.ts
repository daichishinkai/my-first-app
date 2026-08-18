// 音名・オクターブと内部用の半音整数（オクターブ*12+音名インデックス）を相互変換するユーティリティ。
// MIDIノート番号とは対応させていない、アプリ内で閉じた自己完結の採番。

export const NOTE_NAMES = [
  "ド",
  "ド#",
  "レ",
  "レ#",
  "ミ",
  "ファ",
  "ファ#",
  "ソ",
  "ソ#",
  "ラ",
  "ラ#",
  "シ",
] as const;

export const MIN_OCTAVE = 2;
export const MAX_OCTAVE = 6;

export const DEFAULT_NOTE_SEMITONE = toSemitone(0, 4); // ド4

export function toSemitone(noteIndex: number, octave: number): number {
  return octave * 12 + noteIndex;
}

export function fromSemitone(semitone: number): {
  noteIndex: number;
  octave: number;
} {
  const octave = Math.floor(semitone / 12);
  const noteIndex = semitone - octave * 12;
  return { noteIndex, octave };
}

export function formatNote(semitone: number): string {
  const { noteIndex, octave } = fromSemitone(semitone);
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export type KeySuggestion = {
  offset: number;
  fitsPerfectly: boolean;
  overflowHigh: number;
  overflowLow: number;
};

// 曲の原曲音域を、自分の声域のちょうど中央に収まるようにシフトする半音数を提案する。
// 曲の音域が声域より広い場合は、はみ出しを上下均等に振り分ける折衷案になる。
export function suggestKeyOffset(
  userLowestNote: number,
  userHighestNote: number,
  songOriginalLowestNote: number,
  songOriginalHighestNote: number,
): KeySuggestion {
  const offset = Math.round(
    (userLowestNote + userHighestNote - (songOriginalLowestNote + songOriginalHighestNote)) / 2,
  );
  const shiftedLow = songOriginalLowestNote + offset;
  const shiftedHigh = songOriginalHighestNote + offset;
  const overflowHigh = Math.max(0, shiftedHigh - userHighestNote);
  const overflowLow = Math.max(0, userLowestNote - shiftedLow);

  return {
    offset,
    fitsPerfectly: overflowHigh === 0 && overflowLow === 0,
    overflowHigh,
    overflowLow,
  };
}
