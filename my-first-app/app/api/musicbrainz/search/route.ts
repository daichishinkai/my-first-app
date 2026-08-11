import { NextRequest, NextResponse } from "next/server";

const MUSICBRAINZ_ENDPOINT = "https://musicbrainz.org/ws/2/recording/";
const USER_AGENT =
  "karaoke-senkyoku-memo/0.1 (daichi.mac.shinkai@gmail.com)";
const MAX_RESULTS = 8;

export type MusicBrainzSuggestion = {
  title: string;
  artist: string;
};

type MusicBrainzRecording = {
  title?: string;
  "artist-credit"?: { name?: string }[];
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL(MUSICBRAINZ_ENDPOINT);
  url.searchParams.set("query", `recording:${query}`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(MAX_RESULTS));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { results: [], error: "network_error" },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { results: [], error: "musicbrainz_error" },
      { status: 502 },
    );
  }

  const data: { recordings?: MusicBrainzRecording[] } = await response.json();

  const seen = new Set<string>();
  const results: MusicBrainzSuggestion[] = [];

  for (const recording of data.recordings ?? []) {
    const title = recording.title;
    const artist = recording["artist-credit"]?.[0]?.name;

    if (!title || !artist) continue;

    const key = `${title}::${artist}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({ title, artist });

    if (results.length >= MAX_RESULTS) break;
  }

  return NextResponse.json({ results });
}
