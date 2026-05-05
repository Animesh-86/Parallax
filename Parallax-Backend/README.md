# Parallax Backend

The Parallax backend is a Spring Boot service that powers authentication, project/workspace APIs, file handling, and real-time collaboration channels.

## Scope and Responsibilities

This service is responsible for:

- JWT-based authentication and protected API access
- OAuth2 login integrations (Google and GitHub)
- REST endpoints for core platform entities
- STOMP/SockJS and raw WebSocket endpoints for collaboration and chat
- Persistence with JPA (H2 for local defaults, PostgreSQL-compatible configuration)
- Runtime configuration for code-runner container images

## Tech Stack

- Java 17
- Spring Boot 3.2.x
- Spring Security, OAuth2 Client
- Spring Data JPA
- Spring WebSocket (STOMP + SockJS)
- Maven Wrapper (`mvnw`, `mvnw.cmd`)
- H2 (default local path) and PostgreSQL driver support

## Project Layout

- `backend/pom.xml`: dependency and build configuration
- `backend/src/main/java`: application source
- `backend/src/main/resources/application.properties`: default runtime settings
- `backend/src/main/resources/application-h2.properties`: H2 profile-friendly defaults

## Prerequisites

- JDK 17+
- Docker (if you use local runner container flows)
- Optional: PostgreSQL if not using default H2 memory datasource

## Local Setup

Run all commands from `Parallax-Backend/backend`.

### 1) Install/build dependencies

macOS/Linux:

```bash
./mvnw clean package -DskipTests
```

Windows PowerShell:

```powershell
.\mvnw.cmd clean package -DskipTests
```

### 2) Configure environment variables

The backend reads a local `.env` file via:

`spring.config.import=optional:file:.env[.properties]`

Key values to define for local auth flows:

- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `DB_URL` (optional override)
- `DB_USERNAME` (optional override)
- `DB_PASSWORD` (optional override)

If these are missing, OAuth client defaults are placeholder values and external login will fail.

### 3) Start the server

macOS/Linux:

```bash
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Default bind:

- Host: `0.0.0.0`
- Port: `8080`

## Runtime Configuration Notes

Important defaults in `application.properties`:

- `spring.datasource.url` defaults to in-memory H2
- `spring.jpa.hibernate.ddl-auto=update`
- `app.frontend.url=http://localhost:3000`
- JWT expiration and refresh expiration are preconfigured
- Runner image names:
  - `parallax-python-runner`
  - `parallax-java-runner`
  - `parallax-cpp-runner`
  - `parallax-js-runner`
- Storage directories under `${user.home}/parallax`

## Frontend Integration

- Expected frontend origin in local development is `http://localhost:3000`
- CORS currently allows local origins for frontend development
- OAuth success redirects to frontend `/oauth-success`
- OAuth failure redirects to frontend `/oauth-failure`
- SockJS/STOMP endpoint is `/ws`

## Running Tests

From `Parallax-Backend/backend`:

```bash
./mvnw test
```

Windows PowerShell:

```powershell
.\mvnw.cmd test
```

## Building a Runnable Jar

```bash
./mvnw clean package
java -jar target/parallax-0.0.1-SNAPSHOT.jar
```

## Troubleshooting

### OAuth invalid_client or auth redirect issues

- Ensure backend is started from `Parallax-Backend/backend` so `.env` is loaded from that directory.
- Confirm `GOOGLE_*` and `GITHUB_*` values are present and valid.
- Confirm `app.frontend.url` matches the running frontend origin.

### Frontend cannot connect to backend

- Verify backend is running on `http://localhost:8080`.
- Verify frontend environment points to the same backend base URL.
- Check that CORS origins include the frontend dev host and port.

### WebSocket connection issues

- Confirm `/ws` is reachable from frontend host.
- Confirm frontend and backend use consistent HTTP/WS host-port combinations.

## Development Notes

- Keep authentication, CORS, and redirect behavior aligned with frontend configuration.
- For any new endpoint, verify security matcher coverage and expected authorization behavior.
- For runner-related changes, keep Docker image names in sync with your local/CI image tags.

## License

Refer to repository-level licensing and policy documentation.

