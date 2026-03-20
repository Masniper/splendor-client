# Splendor — Frontend (React + Vite)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-Private-red)

Browser client for **Splendor Online**: auth, lobby, public rooms, live multiplayer via **Socket.io**, and a responsive board UI built with **React 19**, **Vite**, and **Tailwind CSS v4**.

---

## Features

- **Authentication** — Login, register, play as guest; token stored locally
- **Setup** — Create/join room by code, browse **public rooms**, theme toggle, balance & avatar header
- **Profile** — View/edit member profile, guest upgrade with server-side rewards
- **Lobby & game** — Real-time players, start match, full in-game actions (tokens, cards, nobles, reserve)
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
- **Backend** — API + Socket.io server running (default [`http://localhost:5001`](http://localhost:5001)); see [back-end README](../back-end/README.md)

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

The bundled `.env.example` states that **no variables are required** for default local development.

| Variable | Required | Description |
|----------|----------|-------------|
| *(none)* | — | API and Socket URLs are currently **hardcoded** to `http://localhost:5001` in source (see below) |

**Deploying to another host:** update the base URLs in:

- `src/network/socket.ts` — `SOCKET_URL`
- `src/components/AuthScreen.tsx` — `API_BASE_URL`
- `src/hooks/useUserProfile.ts`, `useLeaderboard.ts`, `useOpponentProfile.ts` — `API_BASE_URL`

> A future improvement is to use `import.meta.env.VITE_API_URL` / `VITE_SOCKET_URL` and document them here.

---

## Project structure

```
front-end/
├── public/                 # Static assets (e.g. background images)
├── src/
│   ├── components/         # UI (board, modals, setup, auth, toast, …)
│   ├── game/               # Shared game types/models
│   ├── hooks/              # useOnlineGame, useUserProfile, leaderboard, opponent
│   ├── network/            # Socket.io singleton client
│   ├── pages/              # Setup, lobby, game shells
│   ├── utils/              # Game view helpers
│   ├── App.tsx             # Auth → setup / lobby / game routing
│   ├── main.tsx            # React root
│   └── index.css           # Global styles + Tailwind
├── index.html
├── package.json
├── vite.config.ts          # (or vite config as present in repo)
└── tsconfig.json
```

---

## API & realtime

The UI expects:

- **REST** — `http://localhost:5001/api` (auth, user, leaderboard, …)
- **WebSocket** — `http://localhost:5001` (Socket.io)

OpenAPI documentation for HTTP routes: **`http://localhost:5001/api-docs`** (served by the backend).

---

## License

This package is **private** (`"private": true` in `package.json`). Add or replace with a public license if you open-source the project.

---

## Related

- **Backend** — [back-end/README.md](../back-end/README.md) for env vars, Prisma, and running the API.
