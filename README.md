
# Parallax

Parallax is a full-stack collaborative development platform for teams that need shared coding sessions, project coordination, communication, and code execution in one product.

This repository is organized as a multi-module workspace with separate frontend and backend applications, plus language runner infrastructure used by the backend execution pipeline.

## What Parallax Includes

- Real-time collaborative coding workflows with shared rooms
- Persistent project and file management
- Authentication with JWT and OAuth2 providers
- REST APIs for product features and data operations
- WebSocket channels for low-latency collaboration
- Voice/video signaling support and meeting-room experiences
- Pluggable container-based code runners (Python, Java, C++, JavaScript)

## Repository Structure

- `Parallax-Frontend/frontend`: React + TypeScript + Vite web application
- `Parallax-Backend/backend`: Spring Boot backend service (REST, auth, WebSocket, persistence)
- `Parallax-Backend/parallax-python-runner`: Runner containers and related assets for execution features
- `Design/`: Design artifacts and references

## High-Level Architecture

1. The frontend renders user-facing pages (landing, dashboard, workspace, rooms, profile, etc.) and connects to backend APIs and WebSocket endpoints.
2. The backend provides authentication, authorization, domain APIs, persistence, and real-time collaboration channels.
3. For code execution flows, the backend targets runner container images configured in backend properties.
4. OAuth login flows redirect back to frontend success/failure routes.

## Prerequisites

- Java 17+
- Node.js 18+
- npm 9+ (or equivalent package manager support)
- Docker (required for local image-based runner workflows)

## Quick Start (Local Development)

Run backend and frontend in separate terminals.

### 1) Start Backend

From `Parallax-Backend/backend`:

```bash
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Default backend URL: `http://localhost:8080`

### 2) Start Frontend

From `Parallax-Frontend/frontend`:

```bash
npm install
npm run dev
```

Default frontend URL: `http://localhost:3000`

## Module-Specific Documentation

- Frontend setup and runtime configuration: see `Parallax-Frontend/README.md`
- Backend configuration, profiles, and API behavior: see `Parallax-Backend/README.md`

## Integration Defaults

- Frontend expects backend at `http://localhost:8080` unless overridden
- Backend expects frontend origin `http://localhost:3000` for local OAuth redirects and CORS
- Backend WebSocket endpoint is mounted at `/ws`

## Common Local Pitfall

The backend imports local `.env` values using:

`spring.config.import=optional:file:.env[.properties]`

Because that path is relative to the current working directory, start the backend from `Parallax-Backend/backend` so OAuth and JWT environment values are loaded from the intended location.

## Build Commands

Backend (from `Parallax-Backend/backend`):

```bash
./mvnw clean package
```

Frontend (from `Parallax-Frontend/frontend`):

```bash
npm run build
```

## Suggested Development Workflow

1. Start backend first and verify `http://localhost:8080/api/health`.
2. Start frontend and verify initial page load.
3. Validate authentication and protected routes.
4. Validate WebSocket-dependent pages (chat/workspace/rooms).
5. Build both modules before opening a pull request.

## Contributing

1. Create a feature branch.
2. Keep frontend and backend changes in sync for API contract updates.
3. Include setup and verification notes in pull requests.
4. Run relevant build/test commands before requesting review.

## License

See project licensing terms in repository policy or module notices.
