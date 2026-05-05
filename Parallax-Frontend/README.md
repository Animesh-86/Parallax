# Parallax Frontend

The Parallax frontend is a React and TypeScript application that delivers the collaborative coding interface, dashboards, rooms, social features, and workspace experiences for the Parallax platform.

## What This Module Provides

- Multi-page product UI (landing, auth, dashboard, profile, workspace, rooms)
- Collaborative workspace experiences built around rich components
- Monaco-based editor integration
- API client integration with backend REST endpoints
- WebSocket/SockJS client paths for real-time communication flows
- OAuth success/failure callback pages coordinated with backend redirects

## Tech Stack

- React 18
- TypeScript 5
- Vite 6
- Tailwind CSS 4
- Radix UI component primitives
- Monaco editor integration
- SockJS and STOMP client dependencies
- Framer Motion and animation utilities

## Directory Overview

Primary application code is in `frontend/`.

- `frontend/src/pages`: route-level pages
- `frontend/src/components`: reusable UI and feature components
- `frontend/src/context`: global state and providers
- `frontend/src/services`: API and websocket-related services
- `frontend/src/auth`: route guards and auth helpers
- `frontend/public`: static assets
- `frontend/vite.config.ts`: build/dev server configuration

## Prerequisites

- Node.js 18+
- npm 9+
- Running backend service (recommended for full feature validation)

## Setup

Run commands from `Parallax-Frontend/frontend`.

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy `.env.example` to `.env.local` and adjust values as needed.

Expected variables:

- `VITE_API_BASE_URL` (default local value: `http://localhost:8080`)
- `VITE_WS_BASE_URL` (default local value: `ws://localhost:8080`)
- `VITE_OAUTH_BASE_URL` (default local value: `http://localhost:8080`)

### 3) Start development server

```bash
npm run dev
```

By configuration, local frontend starts at `http://localhost:3000`.

## Scripts

- `npm run dev`: start Vite development server
- `npm run build`: build production assets into `frontend/build`

## Backend Integration Defaults

- HTTP API base URL defaults to `http://localhost:8080` when env var is not set
- SockJS endpoint is expected at backend path `/ws`
- OAuth callbacks are coordinated with backend redirect flows:
  - success route: `/oauth-success`
  - failure route: `/oauth-failure`

## Development Workflow

1. Start backend on `http://localhost:8080`.
2. Start frontend on `http://localhost:3000`.
3. Validate login flow and protected routes.
4. Validate workspace pages that rely on websocket activity.
5. Build before creating a pull request.

## Production Build

```bash
npm run build
```

Build output is generated under `frontend/build`.

## Troubleshooting

### UI loads but API requests fail

- Check `VITE_API_BASE_URL` in `.env.local`.
- Confirm backend server is reachable on the configured host and port.
- Confirm backend CORS allows the frontend origin.

### OAuth returns but user is not signed in

- Confirm backend is configured with valid OAuth client credentials.
- Confirm backend `app.frontend.url` matches frontend origin.
- Confirm frontend callback routes (`/oauth-success`, `/oauth-failure`) are available in routing.

### Realtime features fail to connect

- Verify backend websocket endpoint `/ws` is reachable.
- Verify `VITE_WS_BASE_URL` and API base host/port are aligned.

## Notes for Contributors

- Keep API contract updates synchronized with backend changes.
- Prefer strongly typed service boundaries in `src/services` and `src/types`.
- Validate both primary dashboards and workspace flows for UI regressions.
- Include screenshots or short verification notes in pull requests for significant UI changes.

## License

Refer to repository-level licensing and policy documentation.
