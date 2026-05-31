# Full-Fledged IDE Architecture & Scalability Migration

This plan expands the architectural migration of Parallax into a fully scalable, enterprise-grade IDE. It includes a unified Workspace Container architecture, code review capabilities, async build queues, and wildcard preview deployments.

## Goal
To provide a full-fledged IDE experience where:
1. Every project runs inside a single, persistent Docker container (the Workspace).
2. The user has a fully interactive terminal (`xterm.js`) connected to this Workspace.
3. Users can conduct Code Review Sessions with inline comments directly in the editor.
4. Heavy tasks (like environment builds or deployments) are offloaded to a Redis-backed queue.
5. Projects can be previewed via dynamic wildcard subdomains (e.g., `feature-branch.parallax.run`).

## Open Questions
> [!IMPORTANT]
> **Queue Technology Stack:** You mentioned `BullMQ`, which is a Node.js specific library. Since Parallax's backend is currently written in **Java (Spring Boot)**, we have two options:
> **Option A:** Use Java's equivalent (Spring Data Redis / Redisson) to handle the build queue directly in the existing backend.
> **Option B:** Spin up a separate, lightweight Node.js microservice specifically to run the BullMQ build worker. Which do you prefer?
> 
> **Terminal Pseudo-TTY (node-pty):** Similarly, `node-pty` is for Node.js. In our Java backend, we currently use Java's native process execution (`ProcessBuilder`) to stream output from Docker, which achieves the exact same interactive result. Should we stick with the Java native process mapping, or move the Terminal WebSocket handling to the new Node.js microservice mentioned above?

## Proposed Changes

---

### 1. Unified Workspace Container

#### [NEW] `backend/backend/Dockerfile.workspace`
Create a unified Dockerfile that extends `ubuntu:22.04` and installs all necessary languages (`python3`, `default-jdk`, `nodejs`, `g++`, etc.) allowing unrestricted terminal access.

#### [MODIFY] `backend/backend/src/main/resources/application.properties`
Point `code.session.image-name` to the new `parallax-workspace` image.

#### [MODIFY] `backend/backend/src/main/java/com/parallax/backend/parallax/service/session/SessionService.java`
- Ensure the container starts with a mapped HTTP port (e.g., 3000) for Next.js preview servers and without restrictive network flags.

#### [MODIFY] `backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunCodeService.java`
- Modify "Run Code" to execute dynamically inside the existing Workspace Container via `docker exec`, rather than spinning up ephemeral containers.

---

### 2. Interactive Terminal (xterm.js + PTY)

#### [MODIFY] `frontend/src/components/workspace/Terminal.tsx`
- Ensure the `xterm.js` configuration correctly handles ANSI escape codes, terminal resizing events, and standard input/output streaming.

#### [MODIFY] `backend/backend/src/main/java/com/parallax/backend/parallax/websocket/terminal/TerminalWebSocketHandler.java`
- Ensure the `docker exec -it` command allocates a true pseudo-TTY (PTY) inside the Workspace Container to support interactive commands like `vim`, `nano`, and interactive prompts.

---

### 3. Code Review & Inline Comments

#### [NEW] Database Entities
- Create `CodeComment` entity to store line-specific comments, threaded replies, resolution status, and the associated file/project ID.

#### [MODIFY] `backend/backend/src/main/java/com/parallax/backend/parallax/controller/file/ProjectFileController.java`
- Add REST endpoints to fetch, create, and resolve inline comments for specific files.

#### [MODIFY] `frontend/src/components/workspace/CodeEditor.tsx`
- Integrate Monaco Editor's `IEditorDecorations` and Zone Widgets to display floating inline comments next to specific line numbers, allowing users to collaborate asynchronously.

---

### 4. Build Queue (Redis / BullMQ)

#### [NEW] Redis Infrastructure
- Add a Redis container to `docker-compose.yml`.
- If Option A (Java): Implement a `BuildQueueService.java` using Spring Data Redis to queue and process heavy container image builds or NPM installations asynchronously.
- If Option B (Node.js): Create a new `build-worker/` Node.js microservice utilizing `BullMQ` to connect to Redis and process build jobs.

---

### 5. Wildcard Preview Deployments

#### [NEW] Reverse Proxy Configuration
- Introduce `Traefik` as an API Gateway/Reverse Proxy.
- Modify `SessionService.java` to attach Docker labels to the Workspace Container when it starts (e.g., `traefik.http.routers.proj-{id}.rule=Host('{projId}.parallax.local')`).
- This will automatically route traffic from a wildcard subdomain directly into the project's container on port 3000 without requiring manual port mapping lookups.

## Verification Plan

### Automated Tests
- Unit tests for the Redis Build Queue processing logic.
- Integration tests ensuring comments are correctly saved and mapped to file line numbers.

### Manual Verification
1. Open the interactive terminal and run an interactive command (e.g., `top` or a Node REPL) to verify proper PTY behavior.
2. Select a line of code in the editor, leave an inline comment, and verify it appears for other collaborators.
3. Trigger a heavy build and verify the UI shows a "Build in queue" state managed by Redis.
4. Access the web project via its dedicated wildcard subdomain instead of a localhost port.
