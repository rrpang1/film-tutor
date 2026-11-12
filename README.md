# film tutor

A personal, game-like course in film photography: 61 skills on a contact-sheet tree, proofs, spaced review, a field log for real rolls, a library of photographers and photobooks, and a critique practice for learning to speak photography. Built around the Pentax K1000. Free to host, works offline, no AI at runtime.

## run it locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3344.

## put it online (free) and use it on every device

1. Create a **public** repository on GitHub (Pages on private repos needs a paid plan; your progress isn't in the repo, so public is fine) and push this folder to its `main` branch.
2. In the repository: **Settings → Pages → Source: GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push. The site appears at `https://<you>.github.io/<repo>/`.
3. Install it as an app:
   - **iPhone**: open the URL in Safari → Share → Add to Home Screen.
   - **Android**: open it in Chrome → Install app.
   - **Windows / Mac**: open it in Chrome or Edge → the install icon in the address bar. (On a Mac in Safari: File → Add to Dock.)
4. Turn on sync on each device: in the app, tap the settings dial on the home screen (the bench) and follow the three steps to paste a GitHub token with only the `gist` scope.

## commands

| | |
|---|---|
| `npm run dev` | dev server on :3344 |
| `npm test` | engine tests + content-pack validation |
| `npm run build` | static export to `out/` + offline service worker |
| `npm run serve` | serve the built `out/` on :3345 |
| `node scripts/icons.mjs` | regenerate the PNG app icons |
