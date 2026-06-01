import { createServer } from 'node:http';
import process from 'node:process';

const API_URL = process.env.PAYLOAD_API_URL ?? 'https://preview.spross.app/api/shortlinks';
const API_KEY = process.env.PAYLOAD_API_TOKEN ?? '';
const REFRESH_MS = Number(process.env.REFRESH_MS ?? 5 * 60 * 1000);
const FALLBACK_URL = process.env.FALLBACK_URL ?? 'https://www.spross.dev';
const PORT = Number(process.env.PORT ?? 3000);

let redirects = new Map();
let lastFetch = null;
let lastError = null;

async function fetchRedirects() {
  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `third-party-access API-Key ${API_KEY}` }
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    const next = new Map();
    for (const link of data.docs ?? []) {
      if (link.code && link.destination) next.set(link.code, link);
    }
    redirects = next;
    lastFetch = new Date();
    lastError = null;
    console.log(`[shortlinks] loaded ${redirects.size} entries`);
  } catch (e) {
    lastError = e.message;
    console.error('[shortlinks] fetch failed:', e.message);
  }
}

function buildDestination(link, search) {
  if (link.stripQueryParams || !search) return link.destination;
  const sep = link.destination.includes('?') ? '&' : '?';
  return link.destination + sep + search.slice(1);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const code = decodeURIComponent(url.pathname.slice(1));

  if (code === 'healthz') {
    const status = lastFetch ? 200 : 503;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: !!lastFetch,
      entries: redirects.size,
      lastFetch: lastFetch?.toISOString() ?? null,
      lastError
    }));
  }

  if (!code) {
    res.writeHead(301, { Location: FALLBACK_URL });
    return res.end();
  }

  const link = redirects.get(code);
  if (!link) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found\n');
  }

  res.writeHead(301, { Location: buildDestination(link, url.search) });
  res.end();
});

await fetchRedirects();
setInterval(fetchRedirects, REFRESH_MS);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[shortlinks] listening on :${PORT}, refresh ${REFRESH_MS}ms, fallback ${FALLBACK_URL}`);
});
