# Splendor — Frontend (React + Vite)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-Private-red)

Browser client for **Splendor Online**: auth, lobby, public rooms, live multiplayer via **Socket.io**, room chat, procedural **Web Audio** SFX, and a responsive board UI built with **React 19**, **Vite**, and **Tailwind CSS v4**.

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

---

## Tech Stack

| Layer | Technologies |
|--------|----------------|
| **UI** | React 19, React DOM |
| **Build** | Vite 6, `@vitejs/plugin-react` |
| **Styling** | Tailwind CSS v4, `@tailwindcss/vite` |
| **Motion** | Framer Motion |
| **Icons** | Lucide React |
| **Routing** | React Router DOM |
| **Realtime** | Socket.io client |
| **Language** | TypeScript |

---

## Prerequisites

- **Node.js** ≥ 18
- **Backend** — API + Socket.io server running; default in dev [`http://localhost:5001`](http://localhost:5001) — see [back-end README](../back-end/README.md)

---

## Installation & Local Setup

```bash
cd front-end
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

## Environment variables

Create an optional **`front-end/.env`** for local development when the API is not on the same origin as the Vite dev server.

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
front-end/
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
│   ├── main.tsx            # React root + GameAudioProvider
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

OpenAPI documentation for HTTP routes: **`http://localhost:5001/api-docs`** (served by the backend in local dev).

---

## License

This package is **private** (`"private": true` in `package.json`). Add or replace with a public license if you open-source the project.

---

## Related

- **Workspace overview** — [../README.md](../README.md)
- **Backend** — [../back-end/README.md](../back-end/README.md) for env vars, Prisma, and room chat socket events.
