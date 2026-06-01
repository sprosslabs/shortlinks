# shortlinks

Tiny zero-dependency Node redirect service for **go.spross.dev**.

Fetches shortlinks from Payload CMS (`/api/shortlinks`) every 5 minutes and serves them as 301 redirects.

## Routes

- `GET /<code>` → 301 to the destination (preserves query params unless `stripQueryParams: true`)
- `GET /healthz` → JSON `{ ok, entries, lastFetch, lastError }`
- `GET /` → 301 to `FALLBACK_URL` (default `https://www.spross.dev`)
- Anything else → 404

## Env vars

| Variable             | Default                                       |
| -------------------- | --------------------------------------------- |
| `PAYLOAD_API_URL`    | `https://preview.spross.app/api/shortlinks`   |
| `PAYLOAD_API_TOKEN`  | (required)                                    |
| `REFRESH_MS`         | `300000` (5 min)                              |
| `FALLBACK_URL`       | `https://www.spross.dev`                      |
| `PORT`               | `3000`                                        |

## Local dev

```bash
echo "PAYLOAD_API_TOKEN=..." > .env
npm run dev
```

## Deploy

Dokploy app in the `spross` project. Dockerfile is the build type; sets `PAYLOAD_API_TOKEN` via env. Domain `go.spross.dev` points at the Hetzner edge.
