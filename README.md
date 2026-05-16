# Parallax

Parallax is a premium, full-stack collaborative development platform designed for modern engineering teams. It integrates shared coding sessions, real-time communication, project coordination, and instant code execution into a single, cohesive experience.

## Key Features

### Real-time Collaborative Coding
*   **Shared Workspace**: Multi-file editing powered by Monaco Editor (the engine behind VS Code).
*   **Conflict Resolution**: Operational Transformation (OT) inspired synchronization logic ensures code consistency across all participants.
*   **Live Cursors**: Track teammates' movements and selections in real-time with zero-latency visual feedback.

### Unified Chat System
*   **Project Chat**: Persistent, high-performance WebSocket channels dedicated to specific coding projects.
*   **Team Chat**: Workspace-wide communication for coordination across multiple projects.
*   **Direct Messaging**: Secure, peer-to-peer messaging for private collaboration.

### Voice and Video Calling
*   **WebRTC Integration**: Low-latency, peer-to-peer media streams for voice and video communication.
*   **Signaling Engine**: Custom signaling implementation using STOMP/WebSockets to coordinate call offers, answers, and ICE candidates.
*   **In-IDE Presence**: Start and join calls directly within the coding environment.

### Gamification and Productivity Tracking
*   **XP and Leveling**: Earn experience points for code commits, project creations, and collaboration milestones.
*   **Achievement System**: Unlock badges (e.g., "Century Club", "Streak Master") based on contribution streaks and platform activity.
*   **Contribution Heatmap**: Visual activity tracking inspired by GitHub's contribution graph.

### Isolated Code Execution
*   **Docker Orchestration**: Pluggable runner architecture that spawns isolated containers for Python, Java, C++, and JavaScript.
*   **Streaming Logs**: Standard output and error streams are captured and pushed to the frontend terminal in real-time.

### Advanced Team Management
*   **Hierarchical Permissions**: Manage roles across Teams, Projects, and individual files.
*   **Versioning Support**: Full branch management, commit history, and Merge Request (MR) workflows.

## Architecture Overview

```mermaid
graph TD
    Client[Frontend - React/TS]
    
    subgraph Backend[Spring Boot Backend]
        Auth[Auth/JWT/OAuth2]
        APIs[REST APIs - Projects/Teams/Files]
        WS[WebSocket Manager - STOMP/Raw]
        Signaling[WebRTC Signaling - Calls]
        Execution[Code Execution Service]
        Gamification[Gamification/Presence]
    end
    
    subgraph Storage[Data & Storage]
        DB[(PostgreSQL/H2)]
        FileSystem[Local File System]
    end
    
    subgraph Infrastructure[Code Runners]
        Docker[Docker Engine]
        Runners[Python/Java/CPP/JS Containers]
    end
    
    Client -- HTTP/REST --> Auth
    Client -- WebSocket --> WS
    Auth --> APIs
    APIs --> DB
    APIs --> FileSystem
    WS --> Signaling
    WS --> Gamification
    Execution -- ProcessBuilder --> Docker
    Docker --> Runners
```

## Repository Structure

- `frontend/`: React + TypeScript + Vite web application using Tailwind CSS 4.
- `backend/backend`: Spring Boot backend service handling auth, persistence, and real-time channels.
- `backend/parallax-python-runner`: Isolated runner infrastructure for code execution.
- `Design/`: UI/UX design artifacts and platform assets.

## Technical Implementation Details

### Backend
- **Framework**: Spring Boot 3.2.x (Java 17)
- **Security**: JWT-based authentication with Google and GitHub OAuth2 providers.
- **WebSocket Architecture**: Hybrid STOMP Over SockJS (`/ws`) for structured events and Raw WebSockets (`/ws/chat/*`) for high-performance messaging.
- **Execution Pipeline**: Spawns isolated Docker containers via ProcessBuilder to capture standard streams.

### Frontend
- **Framework**: React 18 + TypeScript 5
- **Styling**: Tailwind CSS 4 + Framer Motion for micro-animations.
- **Service Layer**: Dedicated API clients for REST and multiple WebSocket handlers for collaboration and chat.

## Prerequisites

- **Java**: 17+
- **Node.js**: 18+ (npm 9+)
- **Docker**: Required for local code runner workflows
- **Environment**: Local .env files for both frontend and backend

## Quick Start (Local Development)

### 1) Start Backend
Navigate to `backend/backend`:
```bash
# macOS/Linux
./mvnw spring-boot:run

# Windows
.\mvnw.cmd spring-boot:run
```
Default backend URL: `http://localhost:8080`

### 2) Start Frontend
Navigate to `frontend`:
```bash
npm install
npm run dev
```
Default frontend URL: `http://localhost:3000`

## Suggested Development Workflow

1. Start backend and verify health at `http://localhost:8080/api/health`.
2. Start frontend and verify landing page load.
3. Test OAuth login (Google/GitHub) and JWT persistence.
4. Validate real-time features (Workspace sync, Chat, Calls).
5. Build both modules before submitting pull requests.

## License

Refer to repository-level licensing and module notices for policy details.
