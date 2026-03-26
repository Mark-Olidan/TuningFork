import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHmac } from "node:crypto";

const loadEnvFile = (envPath) => {
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(resolve(process.cwd(), ".env.backend.local"));

const ACR_HOST = process.env.ACR_HOST;
const ACR_ACCESS_KEY = process.env.ACR_ACCESS_KEY;
const ACR_ACCESS_SECRET = process.env.ACR_ACCESS_SECRET;
const PORT = Number(process.env.PORT || 8787);
let lastAcrPayload = null;

if (!ACR_HOST || !ACR_ACCESS_KEY || !ACR_ACCESS_SECRET) {
  console.error(
    "Missing ACRCloud env vars. Set ACR_HOST, ACR_ACCESS_KEY, and ACR_ACCESS_SECRET in .env.backend.local",
  );
  process.exit(1);
}

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(payload));
};

const parseJsonBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8");
  return JSON.parse(rawBody);
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  return response.json();
};

const pickFirstString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
};

const normalizeAppleArtwork = (url) => {
  if (!url || typeof url !== "string") {
    return undefined;
  }
  return url.replace("{w}", "1000").replace("{h}", "1000");
};

const normalizeItunesArtwork = (url) => {
  if (!url || typeof url !== "string") {
    return undefined;
  }

  return url
    .replace("100x100bb", "1000x1000bb")
    .replace("100x100", "1000x1000");
};

const fetchDeezerArtwork = async (albumId) => {
  if (!albumId) {
    return undefined;
  }

  try {
    const deezer = await fetchJson(`https://api.deezer.com/album/${albumId}`);
    return pickFirstString(
      deezer?.cover_xl,
      deezer?.cover_big,
      deezer?.cover_medium,
      deezer?.cover,
    );
  } catch {
    return undefined;
  }
};

const fetchItunesArtwork = async ({ title, artist }) => {
  if (!title || !artist) {
    return undefined;
  }

  try {
    const term = encodeURIComponent(`${title} ${artist}`);
    const itunes = await fetchJson(
      `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`,
    );

    if (!Array.isArray(itunes?.results) || itunes.results.length === 0) {
      return undefined;
    }

    const exact = itunes.results.find(
      (item) =>
        typeof item?.trackName === "string" &&
        typeof item?.artistName === "string" &&
        item.trackName.toLowerCase() === title.toLowerCase() &&
        item.artistName.toLowerCase() === artist.toLowerCase(),
    );

    const candidate = exact || itunes.results[0];
    return normalizeItunesArtwork(candidate?.artworkUrl100);
  } catch {
    return undefined;
  }
};

const mapMatch = async (acrPayload) => {
  const music = acrPayload?.metadata?.music;
  if (!Array.isArray(music) || music.length === 0) {
    return null;
  }

  const top = music[0];
  const artist = Array.isArray(top.artists) && top.artists[0]?.name;
  const album = pickFirstString(
    top.album?.name,
    top.external_metadata?.deezer?.album?.title,
    top.external_metadata?.spotify?.album?.name,
  );

  let artwork = pickFirstString(
    top.external_metadata?.spotify?.album?.images?.[0]?.url,
    top.external_metadata?.spotify?.album?.images?.[1]?.url,
    top.external_metadata?.deezer?.album?.cover_xl,
    top.external_metadata?.deezer?.album?.cover_big,
    top.external_metadata?.deezer?.album?.cover_medium,
    top.external_metadata?.deezer?.album?.cover,
    normalizeAppleArtwork(top.external_metadata?.apple_music?.artwork?.url),
  );

  if (!artwork) {
    artwork = await fetchDeezerArtwork(top.external_metadata?.deezer?.album?.id);
  }

  if (!artwork) {
    artwork = await fetchItunesArtwork({
      title: top.title,
      artist,
    });
  }

  return {
    title: top.title || "Unknown song",
    artist: artist || "Unknown artist",
    album: album || "Album unavailable",
    artwork,
    acrid: top.acrid,
  };
};

const identifyWithAcrCloud = async (audioBuffer, mimeType) => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signatureSource = `POST\n/v1/identify\n${ACR_ACCESS_KEY}\naudio\n1\n${timestamp}`;
  const signature = createHmac("sha1", ACR_ACCESS_SECRET)
    .update(signatureSource)
    .digest("base64");

  const form = new FormData();
  form.set("sample", new Blob([audioBuffer], { type: mimeType }), "sample.m4a");
  form.set("sample_bytes", String(audioBuffer.length));
  form.set("access_key", ACR_ACCESS_KEY);
  form.set("data_type", "audio");
  form.set("signature_version", "1");
  form.set("signature", signature);
  form.set("timestamp", timestamp);

  const response = await fetch(`https://${ACR_HOST}/v1/identify`, {
    method: "POST",
    body: form,
  });

  const payload = await response.json();
  return { response, payload };
};

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && req.url === "/debug/last-acr") {
    sendJson(res, 200, {
      ok: true,
      hasPayload: Boolean(lastAcrPayload),
      payload: lastAcrPayload,
    });
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/suggestions")) {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    const title  = urlObj.searchParams.get("title")  || "";
    const artist = urlObj.searchParams.get("artist") || "";

    if (!title || !artist) {
      sendJson(res, 400, { ok: false, error: "title and artist are required" });
      return;
    }

    try {
      const q = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
      const searchResult = await fetchJson(`https://api.deezer.com/search?q=${q}&limit=1`);
      const trackId = searchResult?.data?.[0]?.id;

      if (!trackId) {
        sendJson(res, 200, { ok: true, suggestions: [] });
        return;
      }

      const radioResult = await fetchJson(`https://api.deezer.com/track/${trackId}/radio?limit=10`);
      const radioTracks = radioResult?.data ?? [];

      const suggestions = radioTracks
        .filter((t) => t.title.toLowerCase() !== title.toLowerCase())
        .slice(0, 6)
        .map((t) => ({
          title:   t.title,
          artist:  t.artist?.name ?? "Unknown Artist",
          artwork: t.album?.cover_big ?? t.album?.cover_medium ?? t.album?.cover ?? null,
        }));

      sendJson(res, 200, { ok: true, suggestions });
    } catch {
      sendJson(res, 500, { ok: false, error: "Failed to fetch suggestions" });
    }
    return;
  }

  if (req.method !== "POST" || req.url !== "/identify") {
    sendJson(res, 404, { ok: false, error: "Not found" });
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const audioBase64 = body?.audioBase64;
    const mimeType = body?.mimeType || "audio/m4a";
    const debugRaw = body?.debugRaw === true;

    if (!audioBase64 || typeof audioBase64 !== "string") {
      sendJson(res, 400, {
        ok: false,
        matched: false,
        error: "Missing audioBase64 payload.",
      });
      return;
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    if (!audioBuffer.length) {
      sendJson(res, 400, {
        ok: false,
        matched: false,
        error: "Audio payload is empty.",
      });
      return;
    }

    const { payload } = await identifyWithAcrCloud(audioBuffer, mimeType);
    lastAcrPayload = payload;
    const match = await mapMatch(payload);

    if (!match) {
      sendJson(res, 200, {
        ok: true,
        matched: false,
        error: payload?.status?.msg || "No match found.",
        acrRaw: debugRaw ? payload : undefined,
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      matched: true,
      match,
      providerStatus: payload?.status || null,
      acrRaw: debugRaw ? payload : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Identification server failed.";

    sendJson(res, 500, {
      ok: false,
      matched: false,
      error: message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`ACRCloud identify server listening on http://localhost:${PORT}`);
  console.log("Health check endpoint: GET /health");
});
