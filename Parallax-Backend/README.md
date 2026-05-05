# Parallax Backend

The Parallax backend is a robust Spring Boot service that powers the platform's core logic, including real-time collaboration, code execution, and secure authentication.

## Core Responsibilities

- **🔐 Identity & Access**: JWT-based authentication with Google and GitHub OAuth2 providers.
- **🚀 Real-time Engine**: Hybrid WebSocket architecture (STOMP for events, Raw WS for high-performance chat).
- **📞 Call Signaling**: WebRTC signaling coordination for peer-to-peer voice and video sessions.
- **⚙️ Code Execution**: Orchestration of isolated Docker containers for secure multi-language code runs.
- **👥 Collaboration Logic**: Management of project workspaces, team synchronization, and live presence.
- **🏆 Platform Services**: Gamification (XP/Levels), Notifications, and User Profile management.

## Tech Stack

- **Framework**: Spring Boot 3.2.x (Java 17)
- **Security**: Spring Security + OAuth2 Client + JWT
- **Persistence**: Spring Data JPA + Hibernate (H2/PostgreSQL)
- **Real-time**: Spring WebSocket + STOMP + SockJS
- **Execution**: ProcessBuilder + Docker Engine API
- **Build**: Maven Wrapper

## WebSocket Architecture

Parallax uses two distinct WebSocket patterns for optimal performance:

1.  **STOMP Over SockJS (`/ws`)**: Used for structured events like cursor tracking, code synchronization, presence updates, and signaling.
2.  **Raw WebSockets (`/ws/chat/*`, `/ws/direct-chat`)**: High-performance, low-overhead binary/text channels for real-time messaging across Projects, Teams, and DMs.

## Environment Configuration

Create a `.env` file in the `backend/` directory with the following keys:

```properties
# Security
JWT_SECRET=your_jwt_secret_here

# OAuth2 Credentials
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Application URLs
APP_FRONTEND_URL=http://localhost:3000

# Database (Optional overrides for PostgreSQL)
DB_URL=jdbc:postgresql://localhost:5432/parallax
DB_USERNAME=parallax
DB_PASSWORD=...
```

## Code Execution Pipeline

The `RunCodeService` handles execution requests by:
1. Creating a temporary job directory.
2. Writing source files to the job directory.
3. Spawning a Docker container using the specific language runner image.
4. Mounting the job directory and capturing standard output/error.
5. Streaming results back to the frontend via WebSockets.

## Local Development

```bash
# Navigate to backend module
cd Parallax-Backend/backend

# Clean and build (skipping tests for speed)
./mvnw clean install -DskipTests

# Run the application
./mvnw spring-boot:run
```

## Running Tests

```bash
./mvnw test
```

## Scaling and Performance

For information on moving from this MVP architecture to a distributed, highly-available production environment, refer to the [ARCHITECTURE_ROADMAP.md](../ARCHITECTURE_ROADMAP.md).

## License

Refer to repository-level licensing and policy documentation.

