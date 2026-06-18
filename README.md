# ntnd.ai — splash site

## Use
Static. Just open `index.html`, or serve the folder:

    python3 -m http.server 8080   # then visit http://localhost:8080

Deploy by uploading this folder to any static host (Netlify, Vercel, GitHub Pages, S3, etc.).

## Contents
- `index.html`      — the page
- `logo.svg`        — wordmark (caret + ntnd.ai + cursor)
- `favicon.svg`     — favicon
- `system/index.css`— ntnd.ai design system (tokens, palettes, primitives, components)

Fonts load from Google Fonts (remote); everything else is local or inline.
