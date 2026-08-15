import express from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const exec = promisify(execFile);
const app = express();
const PORT = process.env.PORT || 3001;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
};

app.use((req, res, next) => {
  res.set(CORS);
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---------------------------------------------------------------
// Lavalink node pool (server side so HTTP-only nodes work over HTTPS)
// ---------------------------------------------------------------
const NODES = [
  {
    id: "millohost-ssl",
    name: "Millohost SSL",
    host: "https://lava-v4.millohost.my.id",
    port: 443,
    auth: "https://discord.gg/mjS5J2K3ep",
    ssl: true,
  },
  {
    id: "kasawa-nonssl",
    name: "Kasawa",
    host: "http://lava2.kasawa.pro",
    port: 2334,
    auth: "youshallnotpass",
    ssl: false,
  },
  {
    id: "jirayu-direct",
    name: "Jirayu Direct",
    host: "http://lavalink.jirayu.net",
    port: 13592,
    auth: "youshallnotpass",
    ssl: false,
  },
  {
    id: "jirayu-ssl",
    name: "Jirayu SSL",
    host: "https://lavalink.jirayu.net",
    port: 443,
    auth: "youshallnotpass",
    ssl: true,
  },
];

function nodeBase(node) {
  return `${node.host}:${node.port}`;
}

function timeoutSignal(ms) {
  return AbortSignal.timeout(ms);
}

async function pingNode(node) {
  const start = Date.now();
  try {
    const res = await fetch(`${nodeBase(node)}/v4/info`, {
      headers: { Authorization: node.auth },
      signal: timeoutSignal(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const info = await res.json();
    return { id: node.id, ping: Date.now() - start, status: "online", info };
  } catch {
    return { id: node.id, ping: -1, status: "offline" };
  }
}

async function searchNode(node, query) {
  const url = `${nodeBase(node)}/v4/loadtracks?identifier=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: node.auth },
    signal: timeoutSignal(15000),
  });
  if (!res.ok) throw new Error(`Lavalink HTTP ${res.status}`);
  const data = await res.json();
  return data;
}

// ---------------------------------------------------------------
// Health cache + latency-aware routing
// ---------------------------------------------------------------
const nodeHealth = new Map(); // id -> { ping, status, at }
const HEALTH_TTL = 15000;

async function pingAndCache(node) {
  const result = await pingNode(node);
  nodeHealth.set(node.id, {
    ping: result.ping,
    status: result.status,
    at: Date.now(),
  });
  return result;
}

async function refreshHealth() {
  const results = await Promise.all(NODES.map(pingNode));
  for (const r of results) {
    nodeHealth.set(r.id, { ping: r.ping, status: r.status, at: Date.now() });
  }
  return results;
}

// Re-ping every 30s in the background so routing always uses fresh data
refreshHealth().catch(() => undefined);
setInterval(() => refreshHealth().catch(() => undefined), 30000);

function getHealthyOrder() {
  const now = Date.now();
  return [...NODES].sort((a, b) => {
    const ha = nodeHealth.get(a.id);
    const hb = nodeHealth.get(b.id);
    const ga = ha && ha.status === "online" && now - ha.at < HEALTH_TTL * 4 ? ha.ping : Infinity;
    const gb = hb && hb.status === "online" && now - hb.at < HEALTH_TTL * 4 ? hb.ping : Infinity;
    if (ga === Infinity && gb === Infinity) return 0;
    return ga - gb;
  });
}

// ---------------------------------------------------------------
// yt-dlp stream resolution
// ---------------------------------------------------------------
const urlCache = new Map();

function cleanVideoId(videoId) {
  return String(videoId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30);
}

async function resolveDirectUrl(videoId) {
  const id = cleanVideoId(videoId);
  if (!id) throw new Error("Missing videoId");
  const cached = urlCache.get(id);
  if (cached && cached.expires > Date.now()) return cached.url;

  const args = [
    "-f",
    "bestaudio[ext=m4a]/bestaudio/best",
    "--no-playlist",
    "--get-url",
    "--no-warnings",
    id,
  ];
  const { stdout } = await exec("yt-dlp", args, {
    timeout: 25000,
    maxBuffer: 1024 * 1024 * 4,
  });
  const url = stdout.trim().split("\n").pop();
  if (!url || !url.startsWith("http")) throw new Error("No stream URL resolved");
  // YouTube URLs expire after ~6h; cache for 5 min
  urlCache.set(id, { url, expires: Date.now() + 5 * 60 * 1000 });
  return url;
}

function proxyStream(req, res, upstreamUrl) {
  const isHttps = upstreamUrl.startsWith("https");
  const requester = isHttps ? httpsRequest : httpRequest;
  const range = req.headers.range;
  const headers = { "User-Agent": req.headers["user-agent"] || "Mozilla/5.0" };
  if (range) headers.Range = range;

  const upstream = requester(upstreamUrl, { headers }, (upRes) => {
    res.status(upRes.statusCode || 200);
    res.set({
      "Content-Type": upRes.headers["content-type"] || "audio/mp4",
      "Accept-Ranges": upRes.headers["accept-ranges"] || "bytes",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    });
    if (upRes.headers["content-range"]) {
      res.set("Content-Range", upRes.headers["content-range"]);
    }
    if (upRes.headers["content-length"]) {
      res.set("Content-Length", upRes.headers["content-length"]);
    }
    if (upRes.statusCode === 200 && !range) {
      res.set("Content-Length", String(upRes.headers["content-length"] || ""));
    }
    upRes.pipe(res);
  });

  upstream.on("error", () => {
    if (!res.headersSent) res.status(502).end("Upstream stream error");
    else res.end();
  });
  req.on("close", () => upstream.destroy());
  upstream.end();
}

// ---------------------------------------------------------------
// Routes
// ---------------------------------------------------------------
app.get("/api/health", async (_req, res) => {
  const results = await refreshHealth();
  res.json({ nodes: results, timestamp: Date.now() });
});

app.get("/api/ping", async (req, res) => {
  const id = req.query.node;
  const node = NODES.find((n) => n.id === id);
  if (!node) return res.status(400).json({ error: "unknown node" });
  const cached = nodeHealth.get(id);
  if (cached && Date.now() - cached.at < HEALTH_TTL) {
    return res.json({ id, ping: cached.ping, status: cached.status });
  }
  res.json(await pingAndCache(node));
});

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const forced = String(req.query.node || "");
  if (!q) return res.status(400).json({ error: "missing query" });

  // Healthy-first ordering: fastest known node first, offline/slowest last.
  let order = getHealthyOrder();
  if (forced) order = [NODES.find((n) => n.id === forced), ...order.filter((n) => n.id !== forced)].filter(Boolean);

  let lastErr = null;
  let attempts = [];
  for (const node of order) {
    const startedAt = Date.now();
    try {
      const data = await searchNode(node, q);
      nodeHealth.set(node.id, {
        ping: Date.now() - startedAt,
        status: "online",
        at: Date.now(),
      });
      return res.json({ node: node.id, result: data });
    } catch (e) {
      lastErr = e;
      attempts.push(node.id);
    }
  }
  res.status(502).json({ error: `All Lavalink nodes failed (${attempts.join(", ")}): ${lastErr?.message || "unknown"}` });
});

app.get("/api/suggest", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json([]);
  try {
    const r = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`,
      { signal: timeoutSignal(8000) }
    );
    const text = await r.text();
    res.type("application/json").send(text);
  } catch {
    res.json([]);
  }
});

app.get("/api/stream", async (req, res) => {
  try {
    const url = await resolveDirectUrl(req.query.videoId);
    proxyStream(req, res, url);
  } catch (e) {
    if (!res.headersSent) res.status(502).json({ error: `Stream resolve failed: ${e.message}` });
    else res.end();
  }
});

// ---------------------------------------------------------------
// Static SPA (built frontend) — served from the same port so the
// preview host can reach both the UI and the /api proxy.
// ---------------------------------------------------------------
const distDir = path.join(__dirname, "..", "dist");

app.use(express.static(distDir));

app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
