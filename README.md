# Splendor — Frontend (React + Vite)

[![Repo](https://img.shields.io/badge/GitHub-splendor--client-181717?logo=github)](https://github.com/Masniper/splendor-client)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Browser client for **Splendor Online**: auth, lobby, public rooms, live multiplayer via **Socket.io**, room chat, procedural **Web Audio** SFX, and a responsive board UI built with **React 19**, **Vite**, and **Tailwind CSS v4**.

This repository is **[Masniper/splendor-client](https://github.com/Masniper/splendor-client)**. It is also vendored as the **`front-end/`** submodule inside the parent app **[Masniper/splendor-app](https://github.com/Masniper/splendor-app)**.

---

## Features

- **Authentication** — Login, register, play as guest; token stored locally
- **Setup** — Create/join room by code, browse **public rooms**, theme toggle, balance & avatar header, **sound mute** control
- **Profile** — View/edit member profile, guest upgrade with server-side rewards
- **Lobby & game** — Real-time players, start match, full in-game actions (tokens, cards, nobles, reserve)
- **Room chat** — In-room messages via Socket.io; **quick phrase** strip and **emoji picker**; history restored when you (re)join the room; **unread badge** on the in-game chat FAB when the sidebar is closed
- **Audio** — Procedural UI and game cues (turn, start, win/lose) through **`GameAudioProvider`**; optional mute
- **Toasts** — Stacked notifications, including a dedicated style for incoming chat when chat is in the background
- **Deployment-friendly URLs** — Defaults to **same-origin** `/api` and `window.location.origin` for Socket.io; override with Vite env vars for local dev
- **Social** — Leaderboard modal, optional opponent profile from avatars
- **Game over** — Winner/loser summaries with account stats when the server settles bets
- **Responsiveness** — Layout tuned for desktop, tablet, and mobile (setup & modals)
- **PWA** — Installable web app (`vite-plugin-pwa`): **Add to Home Screen** on iOS Safari, install prompt on Chromium; static assets cached offline; **API and Socket.io are not cached** (always network)

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **UI** | React 19, React DOM |
| **Build** | Vite 6, `@vitejs/plugin-react`, `vite-plugin-pwa` |
| **Styling** | Tailwind CSS v4, `@tailwindcss/vite` |
| **Motion** | Framer Motion |
| **Icons** | Lucide React |
| **Routing** | React Router DOM |
| **Realtime** | Socket.io client |
| **Language** | TypeScript |

---

## Prerequisites

- **Node.js** ≥ 18
- **Backend** — REST + Socket.io server; local dev default **`http://localhost:5001`**. Use **[splendor-server](https://github.com/Masniper/splendor-server)** ([README](https://github.com/Masniper/splendor-server#readme)).

---

## Installation & local setup

### Clone (standalone)

```bash
git clone https://github.com/Masniper/splendor-client.git
cd splendor-client
npm install
npm run dev
```

### Clone as part of the full stack

```bash
git clone --recurse-submodules https://github.com/Masniper/splendor-app.git
cd splendor-app/front-end
npm install
npm run dev
```

The dev server binds to **`http://localhost:3000`** (all interfaces: `0.0.0.0`).

```bash
# Typecheck (no emit)
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Docker

The **multi-stage** `Dockerfile` runs `npm run build` (Node 20) and copies the `dist/` output into **nginx:alpine**. `nginx.docker.conf` proxies **`/api`**, **`/api-docs`**, and **`/socket.io/`** to the API service on the Compose network. Default Vite env (**same-origin** `/api` and browser origin for Socket.io) matches this layout—no extra `VITE_*` build args are required for the bundled stack.

Build context is trimmed via `.dockerignore`. Compose entrypoint: parent [**splendor-app**](https://github.com/Masniper/splendor-app) `docker-compose.yml`.

---

## PWA (install / Add to Home Screen)

Production builds emit a **web app manifest** (`site.webmanifest`) and a **service worker** that precaches static assets. Multiplayer still requires network access for REST and Socket.io (those routes are excluded from offline navigation fallbacks and use `NetworkOnly` caching).

**Requirements**

- **HTTPS** in production (or `http://localhost` for development). Browsers will not treat the app as installable on plain HTTP except on localhost.
- After `npm run build`, test with `npm run preview` and open DevTools → **Application** → Manifest / Service Workers.

**iPhone / iPad (Safari)** — open the site → **Share** (□↑) → **Add to Home Screen**.

**Android (Chrome)** — menu → **Install app** / **Add to Home screen** when offered.

**Desktop (Chrome / Edge)** — look for the install icon in the address bar, or Settings → **Install Splendor…**.

---

## Environment variables

Create an optional **`.env`** in this directory for local development when the API is not on the same origin as the Vite dev server.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | REST API base URL. **Default:** `/api` (same origin as the page — typical behind Nginx). For local dev against `localhost:5001`, set to `http://localhost:5001/api`. |
| `VITE_SOCKET_URL` | No | Socket.io server URL (no path). **Default:** `window.location.origin` in the browser. For local dev, set to `http://localhost:5001`. |

**Example (local backend on port 5001):**

```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

> Types for `import.meta.env` are declared in `src/vite-env.d.ts`. Never commit secrets in env files.

---

## Project structure

```
splendor-client/   # or splendor-app/front-end/
├── public/                 # Static assets (e.g. background images)
├── src/
│   ├── audio/              # Procedural Web Audio SFX (gameAudio.ts)
│   ├── components/         # UI (board, modals, setup, auth, RoomChatPanel, …)
│   ├── constants/          # Chat emoji groups & quick phrases
│   ├── context/            # GameAudioContext (mute + play helpers)
│   ├── game/               # Shared game types/models
│   ├── hooks/              # useOnlineGame, useRoomChat, profiles, leaderboard
│   ├── network/            # Socket.io singleton client
│   ├── pages/              # Setup, lobby, game shells
│   ├── utils/              # Game view helpers
│   ├── App.tsx             # Auth → setup / lobby / game routing
│   ├── main.tsx            # React root, GameAudioProvider, PWA service worker registration
│   └── index.css           # Global styles + Tailwind
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## API & realtime

The UI expects:

- **REST** — Same-origin **`/api`** in production, or `VITE_API_BASE_URL` in dev
- **WebSocket** — Socket.io on the same host as configured by `VITE_SOCKET_URL` / default origin

OpenAPI documentation for HTTP routes (served by the backend): **`http://localhost:5001/api-docs`** in typical local dev.

---

## License

This project is licensed under the **MIT License** — see [`LICENSE`](./LICENSE).

---

## Related

- **Full stack (parent + submodules)** — [Masniper/splendor-app](https://github.com/Masniper/splendor-app)
- **Backend API** — [Masniper/splendor-server](https://github.com/Masniper/splendor-server)
