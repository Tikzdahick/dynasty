import { NextRequest } from "next/server";

// Server-side proxy for NBA headshots. cdn.nba.com serves the images fine to a
// server fetch (like curl) but breaks the HTTP/2 stream to browsers
// (net::ERR_HTTP2_PROTOCOL_ERROR), so a direct <img src="cdn.nba.com/..."> never
// loads. Fetching here and re-serving from our own origin fixes that. Runs on the
// Node runtime so the upstream fetch behaves like curl.
export const runtime = "nodejs";

const UPSTREAM = "https://cdn.nba.com/headshots/nba/latest/1040x760";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // Only numeric NBA person ids — prevents the proxy being used to fetch
  // arbitrary paths off the CDN.
  if (!/^\d+$/.test(id)) {
    return new Response("Bad id", { status: 400 });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/${id}.png`, {
      headers: { "User-Agent": "Mozilla/5.0 (DynastyHeadshotProxy)" },
      cache: "no-store",
    });

    // Pass failures through as non-200 so the card's onError shows the initials
    // fallback instead of a broken image.
    if (!upstream.ok) {
      return new Response(null, { status: upstream.status });
    }

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        // Images are static per id — cache hard in the browser and at the edge.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
