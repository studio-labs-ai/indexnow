#!/usr/bin/env node
/**
 * indexnow: a tiny, dependency-free IndexNow submitter (Node 18+, native fetch).
 * Built by Studio Labs (https://www.studiolabsai.com).
 *
 * Usage:
 *   INDEXNOW_HOST=example.com INDEXNOW_KEY=<key> node indexnow.mjs
 *       Submit every <loc> from https://<host>/sitemap.xml
 *   INDEXNOW_HOST=example.com INDEXNOW_KEY=<key> node indexnow.mjs <url> [<url> ...]
 *       Submit only the given URLs.
 *
 * Host <key>.txt at https://<host>/<key>.txt with the key as its exact content.
 */

const HOST = process.env.INDEXNOW_HOST;
const KEY = process.env.INDEXNOW_KEY;
if (!HOST || !KEY) {
  console.error('Set INDEXNOW_HOST and INDEXNOW_KEY environment variables.');
  process.exit(1);
}
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION || `https://${HOST}/${KEY}.txt`;
const SITEMAP = process.env.INDEXNOW_SITEMAP || `https://${HOST}/sitemap.xml`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function explain(status) {
  if (status === 200) return 'OK. URLs accepted.';
  if (status === 202) return 'Accepted. URLs received; validation pending.';
  if (status === 400) return 'Bad request. Invalid JSON or format.';
  if (status === 403) return 'Forbidden. Key not found or incorrect at keyLocation.';
  if (status === 422) return 'Unprocessable. A URL does not match the host, or the key does not match.';
  if (status === 429) return 'Too Many Requests. Rate limited; retry later.';
  return `Unexpected status ${status}.`;
}

async function getSitemapUrls() {
  console.log(`Reading sitemap: ${SITEMAP}`);
  const res = await fetch(SITEMAP, { headers: { 'user-agent': 'indexnow-submitter' } });
  if (!res.ok) throw new Error(`sitemap fetch failed: HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
  if (urls.length === 0) throw new Error('no <loc> entries found in sitemap');
  return urls;
}

async function submit(urls) {
  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => '');
  return { status: res.status, text };
}

async function main() {
  const args = process.argv.slice(2);
  const urls = args.length > 0 ? args : await getSitemapUrls();

  const offHost = urls.filter((u) => {
    try { return new URL(u).host !== HOST; } catch { return true; }
  });
  if (offHost.length > 0) {
    console.error(`Refusing: ${offHost.length} URL(s) not on ${HOST}:`);
    offHost.forEach((u) => console.error(`  - ${u}`));
    process.exit(1);
  }

  console.log(`Submitting ${urls.length} URL(s) to IndexNow:`);
  urls.forEach((u) => console.log(`  - ${u}`));

  const { status, text } = await submit(urls);
  console.log(`\nHTTP ${status}. ${explain(status)}`);
  if (text.trim()) console.log(`Response: ${text.trim()}`);

  process.exit(status === 200 || status === 202 ? 0 : 1);
}

main().catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
