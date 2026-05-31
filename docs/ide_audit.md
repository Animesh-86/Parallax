# IDE & Code Execution System Audit

This document outlines a deep technical audit of the Parallax IDE, Code Execution Engine, Terminal, Language Support, and Server systems. It identifies critical bugs (including severe security vulnerabilities) and proposes a roadmap to transform Parallax into a full-fledged, professional-grade IDE.

---

## 1. Terminal & PTY (Critical Issues)

### 🐛 Bugs & Security Vulnerabilities
- **[CRITICAL SECURITY] Unauthenticated Terminal WebSocket:** The `TerminalWebSocketHandler` endpoint (`/ws/terminal/{projectId}`) is not protected by any handshake interceptor (unlike Chat or Team Chat). Anyone with a `projectId` can connect to the WebSocket and execute arbitrary bash commands inside the project's docker container as root.
- **[BUG] No True PTY Allocation:** The terminal runs `docker exec -i ... /bin/bash` via Java's `ProcessBuilder`. Because it lacks the `-t` flag and a real pseudo-terminal (PTY) allocator, interactive applications like `vim`, `nano`, `top`, or the Python REPL will either break, echo input incorrectly, or fail to render UI.

### ✨ Proposed Features
- **True PTY Support:** Implement a proper PTY bridge. Since the backend runs on Windows/Linux, we should use the Docker Engine API directly (e.g., `docker-java` library) which natively supports `AttachContainerCmd` with `.withTty(true)`.
- **Multi-Terminal Support:** Allow users to open multiple terminal tabs in the frontend, each connecting to a new `/bin/bash` session.

---

## 2. File System & Storage Architecture

### 🐛 Bugs & Architectural Flaws
- **[BUG] The `node_modules` / Build Output Problem:** `FileService` uses PostgreSQL as the single source of truth, syncing to the disk before execution. However, `WebProjectExecutionService` runs `npm install` inside the container. This creates `node_modules` on disk, which are *never* synced back to the database. When the project restarts, the DB snapshot overwrites the workspace, losing all `node_modules` or build artifacts.
- **[PERFORMANCE] Database Bloat:** Storing raw file contents in PostgreSQL (`ProjectFile.content`) works for small scripts but fails for real web applications, images, or large datasets.

### ✨ Proposed Features
- **Disk as Source of Truth:** The file system (or an S3 bucket with EBS volumes) should be the source of truth for workspace files. The DB should only track project metadata.
- **Virtual File System (VFS):** Implement a VFS over WebSocket for the frontend File Explorer so it reads the live state of the container's disk, naturally exposing `node_modules` and generated files.

---

## 3. Language Support & Servers

### 🐛 Bugs & Limitations
- **[LIMITATION] Hardcoded Web Project Detection:** `WebProjectExecutionService` assumes every web project uses `npm install && npm run dev` and exposes port 3000. It doesn't natively support Python (Django/FastAPI), Java (Spring Boot), or non-standard Node scripts.
- **[LIMITATION] Single Port Forwarding:** The system only captures a single `webPort` per session. If a user runs a frontend on 3000 and a backend on 8080 inside the same workspace, the IDE cannot expose the second port.
- **[LIMITATION] Sequential Execution Lock:** `ExecutionLockService` and `RunCodeService` enforce a strict lock per project. Only one script can be executed at a time. A user cannot run a background watcher script and then run a unit test.

### ✨ Proposed Features
- **Universal DevContainers:** Adopt the `devcontainer.json` standard. Spin up a universal container that has Node, Python, Java, and C/C++ pre-installed, rather than dynamically guessing based on file extensions.
- **Dynamic Port Forwarding:** Implement a mechanism (via an agent inside the container or Docker API) to detect when a process binds to a port (0.0.0.0:XXXX) and automatically proxy that port to a unique Parallax subdomain (e.g., `port-8080-proj123.parallax.run`).
- **Parallel Executions:** Remove the global execution lock. Allow multiple `RunCodeService` processes to run concurrently within the same container.

---

## 4. IDE Editor & DX (Developer Experience)

### 🐛 Bugs & Limitations
- **[LIMITATION] Missing LSP (Language Server Protocol):** The frontend uses Monaco Editor, but it lacks intelligence. There is no auto-completion for project files, no real-time linting, and no jump-to-definition.
- **[BUG] Activity Panel / Git State:** The file tree does not show Git decorations (Modified, Untracked, Deleted). 

### ✨ Proposed Features
- **Language Server Protocol (LSP):** Run language servers (e.g., `tsserver`, `pylsp`, `jdtls`) inside the Docker container and proxy the JSON-RPC messages over WebSocket to the Monaco Editor.
- **Integrated Debugger:** Use the Debug Adapter Protocol (DAP) to add visual breakpoints, variable inspection, and call stacks to the editor.
- **Global Search:** Add a global "Search in Files" feature across the workspace using `ripgrep` running in the container.

---

## Summary of Next Steps for a "Full-Fledged IDE"

If we were to prioritize, the roadmap would look like this:

1. **Phase 1: Terminal & Security Fixes (Immediate)**
   - Secure the Terminal WebSocket with a JWT interceptor.
   - Refactor terminal execution to use `docker-java` for true PTY support.
2. **Phase 2: File System Overhaul**
   - Migrate away from DB-backed files to a Container-backed Virtual File System (VFS) to support `node_modules` and heavy frameworks.
3. **Phase 3: Universal Workspaces & Dynamic Ports**
   - Standardize on a single Ubuntu-based DevContainer.
   - Implement dynamic port forwarding for arbitrary web servers (Vite, Django, Spring).
4. **Phase 4: Intelligence (LSP & DAP)**
   - Integrate Monaco Editor with Language Servers running inside the container.
