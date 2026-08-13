import { NextRequest, NextResponse } from "next/server";

const VOCADB_ENDPOINT = "https://vocadb.net/api/songs";
const MAX_RESULTS = 8;

export type VocaDbSuggestion = {
  title: string;
  artist: string;
};

type VocaDbSong = {
  name?: string;
  artistString?: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL(VOCADB_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("maxResults", String(MAX_RESULTS));
  url.searchParams.set("nameMatchMode", "Auto");
  url.searchParams.set("fields", "Artists");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
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
      { results: [], error: "vocadb_error" },
      { status: 502 },
    );
  }

  const data: { items?: VocaDbSong[] } = await response.json();

  const seen = new Set<string>();
  const results: VocaDbSuggestion[] = [];

  for (const song of data.items ?? []) {
    const title = song.name;
    const artist = song.artistString;

    if (!title || !artist) continue;

    const key = `${title}::${artist}`;
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({ title, artist });

    if (results.length >= MAX_RESULTS) break;
  }

  return NextResponse.json({ results });
}
