# Static assets (`public/`)

Vite serves this folder at the site root (`/`).

## Always expected at repo root here

| Path | Used by |
|------|---------|
| `favicon.ico`, `favicon-*.png`, `apple-touch-icon.png` | `index.html` |
| `android-chrome-*.png` | `vite.config.ts` (PWA manifest) |
| `icons/*.png` | `src/constants.ts` — gem chip icons (`/icons/...`) |
| `images/cards.jpg` | `src/utils/splendorSprites.ts` — development card sprite sheet |
| `images/nobles.jpg` | `splendorSprites.ts` — noble sprite sheet |
| `images/numbers_sheet.png` | `splendorSprites.ts` |
| `images/gems.png` | `splendorSprites.ts` |
| `images/tokens.png` | `src/constants.ts` — token disc sprite |
| `images/oleum-small.png` | `splendorSprites.ts` |
| `images/game-bg.jpg`, `images/startup-bg.jpg` | Page backgrounds in `GamePage`, `Lobby`, etc. |

## Optional folders (may be omitted in a minimal tree)

These paths are referenced by the app; if missing, the client uses **remote fallbacks** (see `src/utils/cardAssets.ts`).

| Folder | URLs | Restore locally |
|--------|------|------------------|
| `images/cards/` | `/images/cards/{cardId}.jpg` | Run `bash scripts/download-splendor-assets.sh` from `front-end/` |
| `images/nobles/` | `/images/nobles/{nobleId}.jpg` | Same script |
| `images/textures/` | `diagmonds-dark.png`, `diagmonds-light.png` | Same script |

Do not rename paths without updating `src/constants.ts`, `src/utils/splendorSprites.ts`, `src/utils/cardAssets.ts`, `index.html`, and `vite.config.ts`.
