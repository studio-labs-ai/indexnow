# indexnow

A tiny, dependency-free [IndexNow](https://www.indexnow.org/) submitter (Node 18+, native `fetch`). It notifies IndexNow-participating search engines (Bing, Yandex, and engines that pull from Bing's index) the moment a page is added or changed. Google does not use IndexNow.

Built and used by [Studio Labs](https://www.studiolabsai.com), an AI product studio.

## Usage

```bash
# Submit every <loc> URL from your sitemap
INDEXNOW_HOST=example.com INDEXNOW_KEY=your-key node indexnow.mjs

# Submit only specific URLs
INDEXNOW_HOST=example.com INDEXNOW_KEY=your-key node indexnow.mjs https://example.com/new-page
```

Host the key file at `https://<host>/<key>.txt` with the key as its exact content, so IndexNow can verify ownership.

## Status codes

- `200` / `202`: accepted
- `400`: bad request
- `403`: key not found or incorrect at keyLocation
- `422`: a URL does not match the host, or the key does not match
- `429`: rate limited

## License

MIT

---

Made by [Studio Labs](https://www.studiolabsai.com).
