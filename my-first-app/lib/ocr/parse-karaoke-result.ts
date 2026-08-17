const NOISE_KEYWORDS = [
  "音程",
  "安定感",
  "安定性",
  "抑揚",
  "ロングトーン",
  "テクニック",
  "総合得点",
  "TOTAL",
  "全国平均",
  "全国順位",
  "総評",
  "JOYSOUND",
  "DAM",
  "分析採点",
  "採点マスター",
  "精密採点",
  "演奏停止",
  "原曲キー",
  "強化モード",
  "マイルーム",
  "プレビュー",
  "次へ",
  "ゲスト",
  "こぶし",
  "しゃくり",
  "ビブラート",
  "ビブラートタイプ",
  "リズム",
  "音量",
  "表現力",
  "カラオケ",
  "後ろノリ",
  "前ノリ",
  "早い",
  "標準",
  "遅い",
  "浅い",
  "深い",
];

const DATE_TIME_RE =
  /\d{4}\s*[/年]\s*\d{1,2}\s*[/月]\s*\d{1,2}|\d{1,2}\s*:\s*\d{2}/;
const MOSTLY_NUMERIC_RE = /^[\d.\/:%点位回\s]+$/;
const SCORE_FRACTION_RE = /\d+\s*\/\s*\d+\s*点?/;
const RANK_RE = /^\d+\s*位$/;
const MEANINGFUL_CHAR_RE = /[぀-ヿ一-鿿0-9A-Za-z*＊]/g;
const MAX_CANDIDATE_LENGTH = 18;

function cleanValue(raw: string): string {
  return raw
    .replace(/^[♪•・:：>＞\s"'「『]+/, "")
    .replace(/[」』"'\s]+$/, "")
    .trim()
    // OCRが日本語の文字間に余分な空白を入れることがあるため、
    // 日本語文字同士の間の空白は詰める(英数字間の空白は保持)。
    .replace(/([぀-ヿ一-鿿])\s+(?=[぀-ヿ一-鿿])/g, "$1");
}

function stripLabel(line: string, labelRe: RegExp): string | null {
  const match = line.match(labelRe);
  if (!match || match.index === undefined) return null;
  return cleanValue(line.slice(match.index + match[0].length));
}

export function parseKaraokeResultText(text: string): {
  title: string;
  artist: string;
} {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let title = "";
  let artist = "";
  const usedIndices = new Set<number>();

  lines.forEach((line, i) => {
    if (!title) {
      const value = stripLabel(line, /曲\s*名/);
      if (value !== null) {
        title = value || cleanValue(lines[i + 1] ?? "");
        usedIndices.add(i);
        if (!value) usedIndices.add(i + 1);
        return;
      }
    }
    if (!artist) {
      const value = stripLabel(line, /歌\s*手\s*名/);
      if (value !== null) {
        artist = value || cleanValue(lines[i + 1] ?? "");
        usedIndices.add(i);
        if (!value) usedIndices.add(i + 1);
      }
    }
  });

  if (title && artist) {
    return { title, artist };
  }

  const candidates = lines.filter((line, i) => {
    if (usedIndices.has(i)) return false;
    if (line.includes("。")) return false; // 総評コメントなどの文章を除外

    const normalized = line.replace(/\s+/g, "");
    if (normalized.length < 2 || normalized.length > MAX_CANDIDATE_LENGTH) {
      return false;
    }
    if (DATE_TIME_RE.test(normalized)) return false;
    if (MOSTLY_NUMERIC_RE.test(normalized)) return false;
    if (SCORE_FRACTION_RE.test(normalized)) return false;
    if (RANK_RE.test(normalized)) return false;
    if (NOISE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      return false;
    }

    const meaningfulCount = (normalized.match(MEANINGFUL_CHAR_RE) ?? []).length;
    if (meaningfulCount / normalized.length < 0.6) return false;

    return true;
  });

  let candidateIndex = 0;
  if (!title && candidates.length > candidateIndex) {
    title = cleanValue(candidates[candidateIndex]);
    candidateIndex++;
  }
  if (!artist && candidates.length > candidateIndex) {
    artist = cleanValue(candidates[candidateIndex]);
  }

  return { title, artist };
}
