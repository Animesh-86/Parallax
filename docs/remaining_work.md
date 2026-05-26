# Parallax — Remaining Work After Audit Remediation

> **Last Updated:** 2026-05-26  
> **Audit Status:** All P0–P3 + Minor + Immediate + Short-term + Medium-term code-level fixes are complete.  
> **What's left:** Items requiring **new infrastructure**, **breaking API changes**, or **dedicated multi-day efforts**.

---

## Table of Contents

1. [Infrastructure Required](#1-infrastructure-required-redis)
2. [Message Broker Migration](#2-message-broker-migration-rabbitmq)
3. [JWT Architecture Change](#3-jwt-architecture-change-httponly-cookies)
4. [Database Migration to PostgreSQL](#4-database-migration-to-postgresql)
5. [File Storage Migration](#5-file-storage-migration-s3minio)
6. [Container Orchestration](#6-container-orchestration-kubernetesfirecrackervisor)
7. [CI/CD Pipeline](#7-cicd-pipeline-github-actions)
8. [Distributed Tracing](#8-distributed-tracing-opentelemetry)
9. [TypeScript Compilation Errors](#9-typescript-compilation-errors)
10. [jjwt Library Upgrade](#10-jjwt-library-upgrade-011x--012x)
11. [Frontend localStorage JWT](#11-frontend-localstorage-jwt-xss-risk)

---

## 1. Infrastructure Required: Redis

### What It Fixes
- **SessionRegistry** — All collaboration sessions stored in-memory (`ConcurrentHashMap`). Server restart = all sessions lost.
- **ExecutionLockService** — Distributed locks needed for multi-instance deployments.
- **RunRateLimiter** — Rate limits reset on restart, exploitable during rolling deploys.
- **Presence tracking** — "Who's online" info vanishes on restart.
- **WebSocket user/project mappings** — `wsToUser`/`wsToProject` maps are in-memory only.

### Why It Can't Be a Code-Only Fix
Requires running a Redis server (local Docker or managed service like AWS ElastiCache / Redis Cloud).

### Implementation Plan

```
1. Add dependencies:
   - spring-boot-starter-data-redis
   - redisson (for distributed locks)

2. Replace SessionRegistry:
   - Store SessionInfo as Redis Hash with TTL
   - Key pattern: parallax:session:{sessionId}
   - Use Redis pub/sub for session lifecycle events

3. Replace ExecutionLockService:
   - Use Redisson's RLock (distributed reentrant lock)
   - Key pattern: parallax:exec-lock:{projectId}
   - Auto-expire locks after 60 seconds (prevents deadlocks)

4. Replace RunRateLimiter:
   - Use Redis sorted sets with ZRANGEBYSCORE for sliding window
   - Key pattern: parallax:rate:{projectId}
   - TTL matches the rate limit window (60s)

5. Presence tracking:
   - Redis SET per project: parallax:presence:{projectId}
   - SADD/SREM on connect/disconnect
   - Use Redis keyspace notifications for cleanup
```

### Estimated Effort
**2–3 days** (including testing edge cases with multi-instance setup)

### Prerequisites
- Docker Compose with Redis service (for local dev)
- Managed Redis instance for production

---

## 2. Message Broker Migration: RabbitMQ

### What It Fixes
- **SimpleBroker** in `WebSocketConfig.java` — all pub/sub happens in JVM memory
- Cannot horizontally scale (User A on instance 1 can't receive messages from User B on instance 2)
- All subscriptions lost on restart
- No message durability or replay

### Implementation Plan

```
1. Add dependency:
   - spring-boot-starter-amqp

2. Replace SimpleBroker:
   config.enableStompBrokerRelay("/topic", "/queue")
       .setRelayHost("localhost")
       .setRelayPort(61613)
       .setClientLogin("guest")
       .setClientPasscode("guest");

3. Configure RabbitMQ with STOMP plugin:
   - rabbitmq-plugins enable rabbitmq_stomp
   - Docker Compose service for local dev

4. Update all WebSocket message handlers to ensure
   they work with external broker message routing
```

### Estimated Effort
**3–5 days** (STOMP relay configuration + testing all chat/code/run WebSocket flows)

### Prerequisites
- RabbitMQ server with STOMP plugin enabled
- Docker Compose service definition

---

## 3. JWT Architecture Change: HttpOnly Cookies

### What It Fixes
- **Minor Issue #9** — Frontend stores JWT in `localStorage`, vulnerable to XSS attacks
- Any XSS vulnerability in the frontend allows full account takeover
- `localStorage` is accessible to any JavaScript running on the page

### Why It's Complex
This is a **coordinated breaking change** across frontend and backend:

```
Backend changes:
  - Set access_token as HttpOnly, Secure, SameSite=Strict cookie
  - Remove Authorization header support (or keep as fallback)
  - Add CSRF protection (required when using cookies for auth)
  - Update all endpoint responses

Frontend changes:
  - Remove all localStorage.getItem("access_token") calls (~15 files)
  - Remove Authorization header injection from api.ts
  - Add CSRF token handling to all API calls
  - Update WebSocket auth to use cookies
  - Update OAuth callback flow
```

### Estimated Effort
**3–5 days** (breaking change, requires careful testing of every auth flow)

### Prerequisites
- Coordinate frontend/backend deployment
- CSRF token mechanism design

---

## 4. Database Migration to PostgreSQL

### What It Fixes
- **H2 file-based** is a dev-only database with limited concurrency
- No full-text search capabilities
- No JSONB for structured metadata
- Subtle behavioral differences from PostgreSQL (even in `MODE=PostgreSQL`)
- `ddl-auto=update` doesn't handle column renames, type changes, or data migrations

### Current State
- Flyway dependency is already added (disabled for H2)
- Initial migration `V1__initial_schema.sql` exists as baseline
- PostgreSQL driver is already in `pom.xml`

### Implementation Plan

```
1. Set up PostgreSQL:
   - Docker Compose service for local dev
   - Managed service (RDS/Cloud SQL) for production

2. Enable Flyway:
   spring.flyway.enabled=true
   spring.flyway.locations=classpath:db/migration
   spring.jpa.hibernate.ddl-auto=validate

3. Complete migration files:
   - V1__initial_schema.sql (exists — needs all tables)
   - V2__add_missing_tables.sql (projects, collaborators, teams, etc.)
   - V3__add_indexes.sql

4. Data migration:
   - Export existing H2 data (if any)
   - Import into PostgreSQL
   - Verify all queries work correctly
```

### Estimated Effort
**1–2 days** (mostly writing complete migration files for all tables)

### Prerequisites
- Complete audit of all JPA entities to generate migration SQL
- PostgreSQL server (local Docker or managed)

---

## 5. File Storage Migration: S3/MinIO

### What It Fixes
- **P3: File content in TEXT columns** — `ProjectFile.content` stores all file content in the database
- Large files (images, binaries) bloat the database
- `findByProjectId` loads ALL file contents into memory (OOM risk)
- No CDN-friendly serving for uploaded assets (avatars, attachments)

### Current Mitigation
- `@Basic(fetch = FetchType.LAZY)` added to `content` field (done)
- This reduces memory usage but doesn't solve the storage scaling problem

### Implementation Plan

```
1. Add dependency:
   - AWS SDK S3 or MinIO client

2. Create FileStorageService:
   - Upload file content to S3/MinIO bucket
   - Store only the S3 key in ProjectFile.content
   - Download on demand

3. Migration:
   - Batch job to move existing TEXT content to object storage
   - Update ProjectFile schema to store reference instead of content

4. Avatar/upload storage:
   - Move from local filesystem to S3
   - Serve via CDN (CloudFront/CloudFlare)
```

### Estimated Effort
**1 week** (includes migration of existing data)

### Prerequisites
- MinIO server (local dev) or AWS S3 bucket (production)

---

## 6. Container Orchestration: Kubernetes/Firecracker/gVisor

### What It Fixes
- Docker containers still run on the host Docker daemon
- No per-execution resource accounting
- No automatic scaling of runner capacity
- Container startup latency (cold start)

### Current Mitigations (Already Done)
- `--network=none` — no network access
- `--memory=256m` — memory capped
- `--cpus=0.5` — CPU capped
- `--pids-limit=100` — fork bomb protection
- `--read-only` — immutable root filesystem
- `--user=nobody` — non-root execution
- `--security-opt=no-new-privileges` — no privilege escalation

### Future State

```
Option A: Kubernetes with gVisor
  - Run code in gVisor-sandboxed pods
  - Stronger kernel-level isolation
  - Kubernetes handles scheduling and resource limits

Option B: Firecracker microVMs
  - Each execution in its own microVM
  - <125ms cold start
  - Complete kernel-level isolation
  - Used by AWS Lambda and Fly.io
```

### Estimated Effort
**2–3 weeks** (significant infrastructure change)

### Prerequisites
- Kubernetes cluster or Firecracker-compatible infrastructure
- Container registry for runner images

---

## 7. CI/CD Pipeline: GitHub Actions

### What It Fixes
- No automated testing on PR/push
- No automated Docker image builds
- No automated deployment
- Manual runner image builds required

### Implementation Plan

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: 21 }
      - run: mvn test -f backend/backend/pom.xml

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd frontend && npm ci && npm run build

  docker-runners:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          docker build -t parallax-python-runner backend/parallax-python-runner/runner
          docker build -t parallax-java-runner backend/parallax-java-runner/runner
          docker build -t parallax-js-runner backend/parallax-js-runner/runner
          docker build -t parallax-cpp-runner backend/parallax-cpp-runner/runner
```

### Estimated Effort
**2–3 days** (including staging deployment pipeline)

---

## 8. Distributed Tracing: OpenTelemetry

### What It Fixes
- No request tracing across services
- No visibility into WebSocket message flow
- No performance profiling of code execution pipeline
- Debugging production issues is "grep the logs and hope"

### Implementation Plan

```
1. Add dependencies:
   - opentelemetry-javaagent (auto-instrumentation)
   - micrometer-tracing-bridge-otel

2. Configure exporter:
   - OTLP exporter → Jaeger or Tempo
   - Trace sampling rate: 10% in production

3. Custom spans:
   - Code execution pipeline (flush → snapshot → docker → output)
   - WebSocket message routing
   - OAuth authentication flow
```

### Estimated Effort
**2–3 days**

### Prerequisites
- Jaeger or Grafana Tempo instance

---

## 9. TypeScript Compilation Errors

### What It Fixes
- **Minor Issue #12** — 50+ TypeScript errors from Radix UI version mismatches and missing types
- Indicates dependency rot in the frontend

### Implementation Plan

```
1. Run: npx tsc --noEmit 2>&1 | head -100
2. Categorize errors:
   - Radix UI type mismatches → update @radix-ui/* packages
   - Missing type definitions → add @types/* packages
   - Actual logic errors → fix code
3. Pin all dependency versions in package.json
4. Add "type-check" script: "tsc --noEmit"
5. Add to CI pipeline
```

### Estimated Effort
**2–4 hours** (dedicated frontend pass)

---

## 10. jjwt Library Upgrade: 0.11.x → 0.12.x

### What It Fixes
- jjwt 0.11.5 is outdated — 0.12.x has security patches and new API

### Why It's Deferred
The 0.12.x API has **breaking changes**:
```java
// OLD (0.11.x) — currently used
Jwts.builder().setSubject(...)
Jwts.parserBuilder().setSigningKey(...)

// NEW (0.12.x) — required after upgrade
Jwts.builder().subject(...)
Jwts.parser().verifyWith(...)
```

Every method in `JwtUtils.java` needs updating. The current version property (`${jjwt.version}`) makes this a one-line version bump + method renames.

### Estimated Effort
**1–2 hours** (mechanical API migration in JwtUtils.java)

---

## 11. Frontend localStorage JWT: XSS Risk

### What It Fixes
- **Minor Issue #9** — JWT stored in `localStorage` is accessible to any JS on the page
- XSS attack = full account takeover

### Current Mitigations
- Content Security Policy headers (not yet implemented)
- Input sanitization on all user-generated content

### Long-term Fix
See [Section 3: JWT Architecture Change](#3-jwt-architecture-change-httponly-cookies) — requires coordinated HttpOnly cookie migration.

### Short-term Mitigation (Can Do Now)

```
1. Add Content-Security-Policy headers:
   Content-Security-Policy: default-src 'self'; script-src 'self'

2. Add X-Content-Type-Options: nosniff
3. Add X-Frame-Options: DENY
4. Add Referrer-Policy: strict-origin-when-cross-origin
```

---

## Priority Matrix

| Priority | Item | Effort | Impact |
|---|---|---|---|
| 🔴 High | Redis for session/lock/rate-limit | 2-3 days | Enables scaling + restart resilience |
| 🔴 High | PostgreSQL migration | 1-2 days | Production-grade persistence |
| 🟡 Medium | CI/CD pipeline | 2-3 days | Automated testing + deployment |
| 🟡 Medium | RabbitMQ for WebSocket | 3-5 days | Multi-instance WebSocket |
| 🟡 Medium | TypeScript fixes | 2-4 hours | Frontend build health |
| 🟡 Medium | jjwt upgrade | 1-2 hours | Security patches |
| 🔵 Low | JWT HttpOnly cookies | 3-5 days | XSS protection |
| 🔵 Low | S3/MinIO file storage | 1 week | Large file support |
| 🔵 Low | OpenTelemetry tracing | 2-3 days | Observability |
| ⚪ Future | Kubernetes/Firecracker | 2-3 weeks | Enterprise-grade sandboxing |

---

## Quick Start for Each Item

```bash
# Redis (local dev)
docker run -d --name parallax-redis -p 6379:6379 redis:7-alpine

# PostgreSQL (local dev)
docker run -d --name parallax-db -p 5432:5432 \
  -e POSTGRES_DB=parallax \
  -e POSTGRES_USER=parallax \
  -e POSTGRES_PASSWORD=parallax \
  postgres:16-alpine

# RabbitMQ with STOMP (local dev)
docker run -d --name parallax-mq -p 5672:5672 -p 15672:15672 -p 61613:61613 \
  rabbitmq:3-management \
  bash -c "rabbitmq-plugins enable rabbitmq_stomp && rabbitmq-server"

# MinIO (local dev)
docker run -d --name parallax-storage -p 9000:9000 -p 9001:9001 \
  minio/minio server /data --console-address ":9001"
```

---

*This document should be updated as items are completed. Check off items by moving them to a "Completed" section at the bottom.*


Connecting to a Neon serverless PostgreSQL database is very easy since we already have the PostgreSQL driver installed in the pom.xml.

Here are the exact steps to connect:

1. Get your Neon Connection String
Log into your Neon dashboard, select your project, and copy the JDBC connection string. It will look something like this: jdbc:postgresql://ep-summer-water-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

2. Update your .env file
Open the .env file located at backend/backend/.env and update (or add) the following database variables. Replace the values with your Neon credentials:

properties
# Database Configuration
DB_URL=jdbc:postgresql://ep-summer-water-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
DB_USERNAME=your_neon_username
DB_PASSWORD=your_neon_password
DDL_AUTO=update
(Note: We keep DDL_AUTO=update for now so Hibernate automatically creates the tables in your empty Neon database).

3. Restart the Backend
Stop your currently running Spring Boot server and start it again:

bash
mvn spring-boot:run
How to verify it worked:
When the server starts, look at the logs. You should no longer see H2 mentioned, and instead see Hibernate connecting to PostgreSQL.
If you go to your Neon dashboard and open the "Tables" view, you should see that Spring Boot automatically created the users, project_files, and other tables for you!