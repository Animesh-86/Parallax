# Parallax API Design Review — Principal Architect Assessment

> **Reviewer scope**: All 29 controller files, security config, WebSocket config, JWT implementation, exception handling, and pom.xml. Every finding references a specific file and line number.

---

## API Design Scorecard

| Dimension | Score | Top Violation | Priority |
|---|---|---|---|
| 1. REST URL design | 4/10 | No API versioning prefix; verb-style URLs (`/start`, `/stop`, `/join`) across 6+ controllers | **P0** |
| 2. HTTP verb correctness | 6/10 | `PUT /{commentId}/resolve` — state transition disguised as full replacement; `PATCH` for invite accept | **P1** |
| 3. Status codes | 5/10 | `createFile` returns 200 instead of 201; `deleteTeam`/`deleteBranch` return 200 instead of 204 | **P1** |
| 4. Error response schema | 3/10 | No unified error DTO; `Map.of("error", ...)` ad-hoc shapes in 12+ endpoints; raw exception messages leak | **P0** |
| 5. API versioning | 1/10 | Zero versioning — all endpoints are `/api/...` with no version segment | **P0** |
| 6. Pagination & filtering | 2/10 | Every list endpoint returns unbounded arrays; zero pagination on messages, commits, branches, comments | **P0** |
| 7. Auth & security headers | 7/10 | JWT missing `jti`, `iss`, `aud` claims; no `X-Request-ID` header; no `Strict-Transport-Security` | **P1** |
| 8. WebSocket protocol | 4/10 | No standard message envelope; no `messageId` for dedup; no typed close codes (4000–4999) | **P1** |
| 9. OpenAPI / Swagger | 0/10 | No `springdoc-openapi` dependency; zero `@Operation` or `@Schema` annotations anywhere | **P0** |

---

## CRITICAL VIOLATIONS

> [!CAUTION]
> These would fail an API design review at any FAANG or Series-B+ company. Fix before any public demo, investor pitch, or portfolio presentation.

### CRIT-1: No API Versioning at All

**Every single endpoint** uses `/api/...` with no version prefix. When you change any response shape, every connected client breaks simultaneously with no migration path.

```
CURRENT:  /api/projects/{id}
CORRECT:  /api/v1/projects/{id}
```

**Blast radius**: All 29 controllers. Every frontend route, every WebSocket endpoint, every integration.

---

### CRIT-2: No Global Error Schema

There are **three different error shapes** in use:

```java
// Shape 1: AuthController (ad-hoc Map)
Map.of("error", "email_already_exists", "message", e.getMessage())

// Shape 2: GlobalExceptionHandler (different Map)
Map.of("error", "bad_request", "message", ex.getMessage(), "timestamp", ...)

// Shape 3: VersioningController (yet another Map)
Map.of("error", e.getMessage())
```

Clients cannot write a single error parser. A principal engineer would reject this API surface on sight.

---

### CRIT-3: Every List Endpoint Lacks Pagination

| Endpoint | Returns | Risk |
|---|---|---|
| `GET /api/chat/direct/{friendId}` | `List<DirectMessage>` — ALL messages, ever | **Memory explosion on long conversations** |
| `GET /api/projects/{id}/versioning/commits` | `List<ProjectCommitResponse>` — ALL commits | **Grows unbounded** |
| `GET /api/projects/{id}/comments` | `List<CodeComment>` — ALL comments | **Grows unbounded** |
| `GET /api/teams/{id}/members` | `List<TeamMemberResponse>` | **100+ member teams** |
| `GET /api/projects/{id}/files` | `List<ProjectFileInfoDto>` | **1000+ file projects** |
| `GET /api/projects` | `List<ProjectResponse>` — ALL user projects | **Power users with 100+ projects** |
| `GET /api/rooms` | `List<RoomResponse>` | **Grows unbounded** |

---

### CRIT-4: Raw Exception Message Exposure in 500 Errors

[GlobalExceptionHandler.java:62-69](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/exception/GlobalExceptionHandler.java#L62-L69):

```java
@ExceptionHandler(RuntimeException.class)
public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
    return ResponseEntity.status(500)
        .body(Map.of("error", "internal_server_error",
                      "message", ex.getMessage(), // ← LEAKS STACK DETAILS
                      ...));
}
```

`ex.getMessage()` can contain SQL errors, Docker daemon errors, file system paths, internal class names. This is an information disclosure vulnerability.

---

## DIMENSION 1: REST URL Design

### 1.1 Verb-style URL Violations

| File | Current URL | Violation | Corrected URL |
|---|---|---|---|
| [SessionController.java:29](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/SessionController.java#L29) | `POST /api/session/{projectId}/start` | Verb in URL | `POST /api/v1/projects/{projectId}/sessions` |
| [SessionController.java:46](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/SessionController.java#L46) | `POST /api/session/{sessionId}/stop` | Verb in URL | `DELETE /api/v1/sessions/{sessionId}` |
| [WebProjectController.java:24](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/WebProjectController.java#L24) | `POST /api/projects/{id}/web/start` | Verb in URL | `POST /api/v1/projects/{id}/web-server` |
| [WebProjectController.java:35](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/WebProjectController.java#L35) | `POST /api/projects/{id}/web/stop` | Verb in URL | `DELETE /api/v1/projects/{id}/web-server` |
| [MeetingRoomController.java:55](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/room/MeetingRoomController.java#L55) | `POST /api/rooms/join/{roomCode}` | Verb in URL | `POST /api/v1/rooms/{roomCode}/participants` |
| [OnboardingController.java:36](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/onboarding/OnboardingController.java#L36) | `POST /api/onboarding/complete` | Verb in URL | `POST /api/v1/onboarding` or `PATCH /api/v1/users/me/onboarding` |
| [VersioningController.java:79](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java#L79) | `POST .../branches/{name}/checkout` | Verb in URL | `POST /api/v1/projects/{id}/git/checkouts` with `{"branch": "name"}` |
| [VersioningController.java:113](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java#L113) | `POST .../branches/{name}/push` | Verb in URL | `POST /api/v1/projects/{id}/git/pushes` |
| [ProjectController.java:132](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/ProjectController.java#L132) | `POST /api/projects/{id}/archive` | Verb in URL | `PATCH /api/v1/projects/{id}` with `{"archived": true}` |
| [ProjectController.java:142](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/ProjectController.java#L142) | `POST /api/projects/{id}/unarchive` | Verb in URL | `PATCH /api/v1/projects/{id}` with `{"archived": false}` |
| [TeamController.java:77](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L77) | `POST /{teamId}/members/invite` | Verb in URL | `POST /api/v1/teams/{teamId}/invitations` |
| [MeetingRoomController.java:146](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/room/MeetingRoomController.java#L146) | `POST /{roomId}/transfer-host` | Verb in URL | `PATCH /api/v1/rooms/{roomId}` with `{"hostId": "..."}` |
| [AiChatController.java:30](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/ai/AiChatController.java#L30) | `POST /api/ai/generate-commit-message` | Verb in URL | `POST /api/v1/ai/commit-messages` |

### 1.2 Singular/Plural Inconsistency

| Current | Problem | Fix |
|---|---|---|
| `/api/session` | Singular | `/api/v1/sessions` |
| `/api/chat/direct` | Adjective, not a noun | `/api/v1/direct-messages` |
| `/{projectId}/file` (singular, in `ProjectFileController`) | Singular mixed with `/files` (plural) on same controller | Unify to `/api/v1/projects/{id}/files/{path}` |

### 1.3 Missing Hierarchical Nesting

| Current | Problem | Corrected |
|---|---|---|
| `GET /api/onboarding/check-username?username=X` | Onboarding is not a resource; username availability is | `GET /api/v1/usernames/{username}/availability` |
| `GET /api/chat/direct/{friendId}` | DMs don't nest under "chat" — they ARE a resource | `GET /api/v1/conversations/{friendId}/messages` |
| `GET /api/workspace/{projectId}/bootstrap` | "Bootstrap" is a verb, not a resource | `GET /api/v1/projects/{projectId}/workspace` |

### 1.4 Multi-Method URL Abomination

[MeetingRoomController.java:85-143](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/room/MeetingRoomController.java#L85-L143): The same URL `/{roomId}/settings` is mapped to `PATCH`, `PUT`, **and** `POST` — all calling the same handler. This is not "compatibility" — it is a contract violation. A REST API must have one correct verb per operation.

```java
// WRONG — three verbs for one operation
@PatchMapping("/{roomId}/settings")   // ← THIS is the correct one
@PutMapping("/{roomId}/settings")     // ← DELETE THIS
@PostMapping("/{roomId}/settings")    // ← DELETE THIS
```

Same violation repeated for `/by-code/{roomCode}/settings`.

---

## DIMENSION 2: HTTP Verb Correctness

| File | Endpoint | Current Verb | Correct Verb | Reason |
|---|---|---|---|---|
| [CodeCommentController.java:56](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/file/CodeCommentController.java#L56) | `/{commentId}/resolve` | `PUT` | `PATCH` | Toggling `resolved=true` is a partial update, not a full replacement |
| [TeamController.java:88](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L88) | `/{teamId}/members/accept` | `PATCH` | `POST` | Accepting an invite is an action that creates a membership, not a partial update |
| [TeamController.java:98](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L98) | `/{teamId}/members/reject` | `DELETE` | `POST` or `DELETE /invitations/{id}` | "Rejecting" is not deleting a member — the member doesn't exist yet |
| [ProfileController.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/profile/ProfileController.java) | `PUT /me/username` | `PUT` | `PATCH` | Updating one field (username) is not replacing the entire user resource |
| [ProfileController.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/profile/ProfileController.java) | `PUT /me/settings` | `PUT` | `PATCH` | IDE settings is a partial update unless the full settings blob is always sent |
| [ProjectController.java:85](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/ProjectController.java#L85) | `POST /{id}/extensions/toggle` | `POST` | `PATCH` | Toggling an extension is a partial update to project state |

### Untyped `Map<String, String>` Request Bodies

14 endpoints accept raw `Map<String, String>` or `Map<String, Object>` instead of typed DTOs:

| File | Endpoint |
|---|---|
| [VersioningController.java:51](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java#L51) | `POST .../branches` → `Map<String, String>` for branch name |
| [VersioningController.java:174](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java#L174) | `POST .../commits` → `Map<String, String>` for branchId + message |
| [VersioningController.java:217](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java#L217) | `POST .../merge-requests` → `Map<String, String>` |
| [ProjectController.java:65](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/ProjectController.java#L65) | `PATCH /{id}/team` → `Map<String, String>` |
| [ProjectController.java:88](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/ProjectController.java#L88) | `POST /{id}/extensions/toggle` → `Map<String, Object>` |
| [ProjectController.java:106](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/ProjectController.java#L106) | `POST /{id}/github/pr` → `Map<String, String>` |
| [MeetingRoomController.java:149](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/room/MeetingRoomController.java#L149) | `POST /{id}/transfer-host` → `Map<String, String>` |

**Why this is a violation**: Maps bypass Jakarta validation (`@NotBlank`, `@Size`), produce no OpenAPI schema, and force clients to guess the key names from reading server source code. Every one of these must be a typed DTO with `@Valid`.

---

## DIMENSION 3: HTTP Status Code Violations

| File | Endpoint | Current | Correct | Fix |
|---|---|---|---|---|
| [ProjectFileController.java:114](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/file/ProjectFileController.java#L114) | `POST /{id}/files` (create file) | `200 OK` | `201 Created` | `ResponseEntity.status(201).body(...)` |
| [CodeCommentController.java:53](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/file/CodeCommentController.java#L53) | `POST .../comments` (add comment) | `200 OK` | `201 Created` | Resource was created |
| [CollaboratorController.java:44](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/collaborator/CollaboratorController.java#L44) | `POST .../collaborators` (invite) | `200 OK` | `201 Created` | Invitation resource was created |
| [TeamController.java:85](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L85) | `POST /{id}/members/invite` | `200 OK` | `201 Created` | Invitation created |
| [TeamController.java:136](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L136) | `DELETE /{teamId}` | `200 OK` | `204 No Content` | Delete should return empty body |
| [TeamController.java:116](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L116) | `DELETE /{id}/members/{mId}` | `200 OK` | `204 No Content` | Delete should return empty body |
| [TeamController.java:179](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L179) | `DELETE /{id}/projects/{pId}` | `200 OK` | `204 No Content` | Unlink is a delete operation |
| [VersioningController.java:107](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java#L107) | `DELETE .../branches/{name}` | `200 OK` | `204 No Content` | |
| [CodeCommentController.java:71](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/file/CodeCommentController.java#L71) | `PUT /{commentId}/resolve` | `200 OK` (empty) | `200 OK` with body, or `204` | If returning nothing, use 204 |
| [TeamController.java:95](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/team/TeamController.java#L95) | `PATCH /{id}/members/accept` | `200 OK` (empty) | `200 OK` with membership body | Empty 200 is useless — return the resource |
| [ProjectController.java:119](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/ProjectController.java#L119) | `POST /{id}/github/pr` | `200 OK` | `201 Created` | A PR resource was created |

---

## DIMENSION 4: Error Response Schema

### 4.1 The Corrected Global Error Schema

Every error response must use this DTO — not `Map.of(...)`:

```java
public record ApiError(
    String code,          // SCREAMING_SNAKE: "PROJECT_NOT_FOUND"
    String message,       // Human-readable: "No project with ID 'abc' was found"
    int status,           // HTTP status code
    String timestamp,     // ISO 8601 UTC
    String path,          // Request path
    String requestId,     // UUID for log correlation
    List<FieldError> details  // For 422 only
) {
    public record FieldError(String field, String code, String message) {}
}
```

### 4.2 Corrected GlobalExceptionHandler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiError.FieldError> details = ex.getBindingResult()
            .getFieldErrors().stream()
            .map(f -> new ApiError.FieldError(f.getField(), 
                 f.getCode(), f.getDefaultMessage()))
            .toList();
        return respond(422, "VALIDATION_FAILED",
            "Request validation failed", req, details);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest req) {
        return respond(404, "RESOURCE_NOT_FOUND", ex.getMessage(), req, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleForbidden(
            AccessDeniedException ex, HttpServletRequest req) {
        return respond(403, "PERMISSION_DENIED",
            "You do not have permission for this action", req, null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedJson(
            HttpMessageNotReadableException ex, HttpServletRequest req) {
        return respond(400, "MALFORMED_REQUEST_BODY",
            "Request body is not valid JSON", req, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleCatchAll(
            Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception on {}", req.getRequestURI(), ex);
        return respond(500, "INTERNAL_ERROR",
            "An unexpected error occurred", req, null);
        // NEVER expose ex.getMessage() in 500 responses
    }

    private ResponseEntity<ApiError> respond(
            int status, String code, String message,
            HttpServletRequest req, List<ApiError.FieldError> details) {
        String requestId = UUID.randomUUID().toString();
        MDC.put("requestId", requestId); // for log correlation
        return ResponseEntity.status(status).body(new ApiError(
            code, message, status,
            Instant.now().toString(),
            req.getRequestURI(),
            requestId, details));
    }
}
```

### 4.3 Error Code Registry (30+ Codes)

| Error Code | HTTP | Trigger | Client Action |
|---|---|---|---|
| `AUTH_TOKEN_EXPIRED` | 401 | JWT `exp` past | Refresh token via `/api/v1/auth/refresh` |
| `AUTH_TOKEN_INVALID` | 401 | Malformed or tampered JWT | Re-login |
| `AUTH_REFRESH_MISSING` | 401 | No `refresh_token` cookie | Re-login |
| `AUTH_REFRESH_REVOKED` | 401 | Refresh session invalidated | Re-login |
| `PERMISSION_DENIED` | 403 | Insufficient RBAC role | Show "access denied" |
| `RESOURCE_NOT_FOUND` | 404 | Generic entity not found | Show 404 page |
| `PROJECT_NOT_FOUND` | 404 | Invalid project ID | Redirect to project list |
| `FILE_NOT_FOUND` | 404 | File path doesn't exist | Show "file not found" |
| `TEAM_NOT_FOUND` | 404 | Invalid team ID | Redirect to dashboard |
| `ROOM_NOT_FOUND` | 404 | Invalid room ID/code | Redirect to rooms list |
| `USER_NOT_FOUND` | 404 | Email/ID lookup failed | Show "user not found" |
| `BRANCH_NOT_FOUND` | 404 | Branch name doesn't exist | Refresh branch list |
| `VALIDATION_FAILED` | 422 | Request body field errors | Highlight fields client-side |
| `MALFORMED_REQUEST_BODY` | 400 | Unparseable JSON | Log client error |
| `INVALID_PARAMETER` | 400 | Bad query/path param format | Fix request |
| `FILE_ALREADY_EXISTS` | 409 | Duplicate file path | Prompt rename |
| `EMAIL_ALREADY_EXISTS` | 409 | Signup with existing email | Prompt login |
| `USERNAME_TAKEN` | 409 | Username already in use | Suggest alternatives |
| `BRANCH_ALREADY_EXISTS` | 409 | Duplicate branch name | Prompt rename |
| `COLLABORATOR_ALREADY_INVITED` | 409 | Duplicate invite | Show existing invite |
| `SESSION_LIMIT_REACHED` | 429 | Max 5 active sessions | Stop an existing session |
| `ROOM_CAPACITY_REACHED` | 429 | Max participants in room | Show "room full" |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Retry after `Retry-After` header |
| `CONTAINER_STARTING` | 202 | Container provisioning | Poll status endpoint |
| `CONTAINER_UNAVAILABLE` | 503 | Docker daemon error | Wait and retry |
| `EXECUTION_TIMEOUT` | 408 | Code ran past time limit | Show timeout message |
| `LSP_UNAVAILABLE` | 503 | Language server crashed | Disable IntelliSense, show warning |
| `GIT_OPERATION_FAILED` | 500 | Git command failed | Show error, suggest retry |
| `AI_SERVICE_UNAVAILABLE` | 503 | AI provider down | Disable AI features temporarily |
| `PAYLOAD_TOO_LARGE` | 413 | File content exceeds limit | Show size limit error |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Wrong Content-Type | Fix request headers |
| `METHOD_NOT_ALLOWED` | 405 | Wrong HTTP method | Fix client code |
| `INTERNAL_ERROR` | 500 | Unhandled exception | Generic "something went wrong" |

---

## DIMENSION 5: API Versioning

### Recommendation: URL Path Versioning

**Strategy**: `/api/v1/...` — correct for Parallax because:
1. Parallax is a developer tool — its consumers expect versioned API contracts
2. URL-based versions are visible in browser devtools, curl output, and logs
3. Load balancers and API gateways (nginx, Traefik) route by URL prefix trivially
4. The frontend is a separate deployment — URL versioning lets you run v1 and v2 simultaneously

### Implementation

**Option A — Application-level prefix** (recommended for Spring Boot):

```yaml
# application.yml
server:
  servlet:
    context-path: /api/v1
```

Then change all `@RequestMapping("/api/...")` to `@RequestMapping("/...")` since the context path provides the prefix. This is the cleanest approach.

**Option B — Per-controller prefix** (if you need mixed v1/v2 in same app):

```java
@RestController
@RequestMapping("/api/v1/projects")  // explicit per controller
public class ProjectController { ... }
```

### Deprecation Headers (when v2 ships)

```java
@Component
public class V1DeprecationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, 
            HttpServletResponse res, FilterChain chain) 
            throws ServletException, IOException {
        if (req.getRequestURI().startsWith("/api/v1/")) {
            res.setHeader("Deprecation", "true");
            res.setHeader("Sunset", "Sat, 31 Dec 2027 23:59:59 GMT");
            res.setHeader("Link", 
                "</api/v2" + req.getRequestURI().substring(7) + 
                ">; rel=\"successor-version\"");
        }
        chain.doFilter(req, res);
    }
}
```

---

## DIMENSION 6: Pagination, Filtering & Sorting

### Standard Pagination Envelope

```json
{
  "data": [ ...items... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8,
    "hasMore": true
  }
}
```

For cursor-based (chat messages, commits):
```json
{
  "data": [ ...items... ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "msg_abc123",
    "prevCursor": null
  }
}
```

### Pagination Strategy by Endpoint

| Endpoint | Strategy | Default `pageSize` | Max `pageSize` | Sort Default |
|---|---|---|---|---|
| `GET /api/v1/projects` | Offset | 20 | 100 | `updatedAt DESC` |
| `GET /api/v1/projects/{id}/files` | Offset | 50 | 200 | `path ASC` |
| `GET /api/v1/projects/{id}/files/tree` | None (tree structure) | — | — | — |
| `GET /api/v1/conversations/{id}/messages` | **Cursor** | 50 | 100 | `createdAt DESC` |
| `GET /api/v1/projects/{id}/git/commits` | **Cursor** | 30 | 100 | `createdAt DESC` |
| `GET /api/v1/projects/{id}/git/branches` | Offset | 20 | 50 | `name ASC` |
| `GET /api/v1/projects/{id}/comments` | **Cursor** | 30 | 100 | `createdAt DESC` |
| `GET /api/v1/projects/{id}/collaborators` | Offset | 20 | 50 | `role, email ASC` |
| `GET /api/v1/teams` | Offset | 20 | 50 | `name ASC` |
| `GET /api/v1/teams/{id}/members` | Offset | 20 | 50 | `role, name ASC` |
| `GET /api/v1/rooms` | Offset | 20 | 50 | `createdAt DESC` |

### Filtering & Sorting Convention

```
GET /api/v1/projects?q=machine+learning&sortBy=updatedAt&sortOrder=desc&page=1&pageSize=20
GET /api/v1/projects/{id}/comments?filePath=src/main.py&resolved=false&cursor=cmt_abc&limit=30
GET /api/v1/projects/{id}/git/commits?branchId=xxx&limit=30&cursor=cmt_xyz
```

---

## DIMENSION 7: Auth & Security Headers

### 7.1 JWT Payload Gaps

[JwtUtils.java:52-66](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/security/JwtUtils.java#L52-L66):

| Field | Current | Issue | Fix |
|---|---|---|---|
| `sub` | `userId.toString()` ✓ | Correct — stable UUID | Keep |
| `jti` | **Missing** | No token revocation possible | Add `UUID.randomUUID().toString()` |
| `iss` | **Missing** | Token origin cannot be verified | Add `"https://api.parallax.io"` |
| `aud` | **Missing** | Token audience unbounded | Add `"parallax-client"` |
| `email` in JWT | Present | PII in JWT — emails may be logged in URLs by proxies | Remove from access token; look up from DB |
| `fullName` in JWT | Present | PII in JWT | Remove from access token |
| Roles | **Missing** | Every request requires a DB lookup for RBAC | Add `roles` claim or accept the latency trade-off |

### 7.2 Missing Security Headers

[SecurityHeadersFilter.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/SecurityHeadersFilter.java) — already good, but missing:

| Header | Status | Fix |
|---|---|---|
| `X-Content-Type-Options: nosniff` | ✅ Present | — |
| `X-Frame-Options: DENY` | ✅ Present | — |
| `Cache-Control: no-store` | ✅ Present (for `/api/`) | — |
| `Referrer-Policy` | ✅ Present | — |
| `Permissions-Policy` | ✅ Present | — |
| `Content-Security-Policy` | ✅ Present | — |
| `Strict-Transport-Security` | ❌ **Missing** | Add `max-age=31536000; includeSubDomains` |
| `X-Request-ID` | ❌ **Missing** | Generate UUID per request, return in header, log with MDC |
| Remove `Server` header | ❌ Not stripped | Add `server.server-header=` (empty) in `application.yml` |

Add to [SecurityHeadersFilter.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/SecurityHeadersFilter.java):

```java
// HSTS
response.setHeader("Strict-Transport-Security", 
    "max-age=31536000; includeSubDomains");

// Request tracing
String requestId = UUID.randomUUID().toString();
response.setHeader("X-Request-ID", requestId);
request.setAttribute("requestId", requestId);

// Strip server identification
response.setHeader("Server", "");
```

### 7.3 CORS Configuration

[SecurityConfig.java:62-80](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/SecurityConfig.java#L62-L80) — **mostly correct**:

- ✅ Uses `frontendUrl` not `*`
- ✅ `allowCredentials(true)` with specific origin (not wildcard)
- ✅ Exposes `Set-Cookie` header

**Missing**: `exposedHeaders` should also include `X-Request-ID` so the frontend can log it:

```java
cfg.setExposedHeaders(List.of("Set-Cookie", "X-Request-ID"));
```

---

## DIMENSION 8: WebSocket Message Protocol

### 8.1 Standard Message Envelope

Every WebSocket message (STOMP and raw) must follow:

```json
{
  "type": "CODE_EDIT",
  "version": 1,
  "messageId": "msg_7f3a9b2c",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "sessionId": "session_abc",
  "userId": "usr_def456",
  "payload": { ... }
}
```

### 8.2 Message Type Registry

| Type | Direction | Payload Schema | ACK Required | Rate Limit |
|---|---|---|---|---|
| **Collaboration** | | | | |
| `CODE_EDIT` | C→S | `{projectId, path, content, isDelta, changes[]}` | Yes (via `CODE_EDIT_ACK`) | 60/s |
| `CODE_EDIT_BROADCAST` | S→C | `{userId, path, isDelta, changes[]}` | No | — |
| `CODE_EDIT_ACK` | S→C | `{messageId, serverRevision}` | — | — |
| `CURSOR_UPDATE` | C→S | `{projectId, path, line, column, selection}` | No | 30/s |
| `CURSOR_BROADCAST` | S→C | `{userId, username, path, line, column, selection, color}` | No | — |
| `PRESENCE_JOIN` | S→C | `{userId, username, avatarUrl}` | No | — |
| `PRESENCE_LEAVE` | S→C | `{userId}` | No | — |
| `PRESENCE_LIST` | S→C | `{users: [{userId, username, avatarUrl}]}` | No | — |
| **Terminal** | | | | |
| `TERMINAL_INPUT` | C→S | `{terminalId, data}` (base64) | No | 120/s |
| `TERMINAL_OUTPUT` | S→C | `{terminalId, data}` (base64) | No | — |
| `TERMINAL_RESIZE` | C→S | `{terminalId, cols, rows}` | No | 5/s |
| `TERMINAL_CLOSED` | S→C | `{terminalId, exitCode}` | No | — |
| **Chat** | | | | |
| `CHAT_MESSAGE` | C→S | `{channelId, content, replyTo?}` | Yes | 10/s |
| `CHAT_BROADCAST` | S→C | `{messageId, channelId, senderId, senderName, content, timestamp}` | No | — |
| `CHAT_TYPING` | C→S | `{channelId, isTyping}` | No | 2/s |
| `CHAT_TYPING_BROADCAST` | S→C | `{channelId, userId, username, isTyping}` | No | — |
| `DM_MESSAGE` | C→S | `{recipientId, content}` | Yes | 10/s |
| `DM_BROADCAST` | S→C | `{messageId, senderId, senderName, content, timestamp}` | No | — |
| **Container Lifecycle** | | | | |
| `CONTAINER_STATUS` | S→C | `{projectId, status, reason?}` | No | — |
| **Room / Call** | | | | |
| `ROOM_CODE_EDIT` | C→S | `{roomId, content, language}` | No | 60/s |
| `ROOM_CODE_BROADCAST` | S→C | `{userId, content, language}` | No | — |
| `ROOM_RUN_OUTPUT` | S→C | `{output, exitCode?}` | No | — |
| `CALL_OFFER` | C→S | `{targetUserId, sdp}` | No | 5/s |
| `CALL_ANSWER` | S→C | `{fromUserId, sdp}` | No | — |
| `CALL_ICE_CANDIDATE` | BOTH | `{targetUserId, candidate}` | No | 30/s |
| **System** | | | | |
| `PING` | C→S | `{}` | No | 0.1/s |
| `PONG` | S→C | `{}` | No | — |
| `ERROR` | S→C | `{code, message}` | No | — |
| `AUTH_EXPIRED` | S→C | `{}` | No | — |
| `RATE_LIMITED` | S→C | `{retryAfterMs}` | No | — |

### 8.3 WebSocket Close Code Registry

| Code | Name | Meaning | Client Action |
|---|---|---|---|
| 1000 | Normal closure | Clean disconnect | No action |
| 1001 | Going away | Server shutting down | Reconnect with backoff |
| 1008 | Policy violation | Auth failed on handshake | Re-login |
| 4000 | Auth expired | JWT expired mid-session | Refresh token, reconnect |
| 4001 | Session full | Max collaborators reached | Show "room full" error |
| 4002 | Rate limited | Client sending too fast | Back off, reconnect in 5s |
| 4003 | Invalid message | Malformed message | Log client-side, ignore |
| 4004 | Session not found | Room/project ID invalid | Redirect to project list |
| 4005 | Container unavailable | Docker sandbox not ready | Wait and retry in 3s |
| 4006 | Kicked | Removed by host/admin | Show "you were removed" |
| 4007 | Server restarting | Deploy in progress | Auto-reconnect in 10s |

---

## DIMENSION 9: OpenAPI / Swagger

### 9.1 Add to pom.xml

```xml
<!-- OpenAPI 3 / Swagger UI -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.0</version>
</dependency>
```

### 9.2 Configuration Bean

```java
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI parallaxOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Parallax IDE API")
                .version("1.0.0")
                .description("Browser-based collaborative IDE with real-time editing, "
                    + "Docker sandboxes, and AI assistance")
                .contact(new Contact()
                    .name("Animesh Sharma")
                    .url("https://github.com/Animesh-86/Parallax")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Access token from /api/v1/auth/login")));
    }
}
```

### 9.3 application.yml Additions

```yaml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: method
    tagsSorter: alpha
  show-actuator: false
  default-produces-media-type: application/json
```

**Access Swagger UI at**: `http://localhost:8080/swagger-ui.html`

### 9.4 Controller Annotation Pattern

```java
@Operation(summary = "Create a project",
    description = "Creates a new project. Requires authentication.",
    tags = {"Projects"})
@ApiResponses({
    @ApiResponse(responseCode = "201", description = "Project created",
        content = @Content(schema = @Schema(implementation = ProjectResponse.class))),
    @ApiResponse(responseCode = "400", description = "Validation failed",
        content = @Content(schema = @Schema(implementation = ApiError.class))),
    @ApiResponse(responseCode = "401", description = "Not authenticated"),
    @ApiResponse(responseCode = "409", description = "Project name conflict")
})
@PostMapping
public ResponseEntity<ProjectResponse> createProject(
    @Valid @RequestBody CreateProjectRequest request,
    @Parameter(hidden = true) Authentication authentication
) { ... }
```

---

## The Corrected URL Map

> [!IMPORTANT]
> This is the canonical API contract for Parallax v1. Every endpoint, correct verb, correct path, correct status codes.

### Auth

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | 201 | Register |
| `POST` | `/api/v1/auth/login` | 200 | Login |
| `POST` | `/api/v1/auth/refresh` | 200 | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | 200 | Revoke session |

### Users / Profiles

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/v1/profiles/me` | 200 | Get own profile |
| `PATCH` | `/api/v1/profiles/me` | 200 | Update display name, bio |
| `PATCH` | `/api/v1/profiles/me/username` | 200 | Update username |
| `PATCH` | `/api/v1/profiles/me/avatar` | 200 | Update avatar URL |
| `POST` | `/api/v1/profiles/me/avatar/upload` | 200 | Upload avatar file |
| `PATCH` | `/api/v1/profiles/me/settings` | 200 | Update IDE settings |
| `GET` | `/api/v1/profiles/{username}` | 200 | Get public profile |
| `GET` | `/api/v1/usernames/{username}/availability` | 200 | Check username availability |

### Onboarding

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/onboarding` | 200 | Complete onboarding |

### Projects

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/projects` | 201 | Create project |
| `GET` | `/api/v1/projects` | 200 | List my projects (paginated) |
| `GET` | `/api/v1/projects/{id}` | 200 | Get project |
| `PATCH` | `/api/v1/projects/{id}` | 200 | Update project (settings, archive, team link) |
| `PUT` | `/api/v1/projects/{id}/settings` | 200 | Replace project settings |
| `DELETE` | `/api/v1/projects/{id}` | 204 | Delete project |

### Files

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/v1/projects/{id}/files` | 200 | List files (flat, paginated) |
| `GET` | `/api/v1/projects/{id}/files/tree` | 200 | Get file tree (hierarchical) |
| `GET` | `/api/v1/projects/{id}/files/content?path=...` | 200 | Get file content |
| `POST` | `/api/v1/projects/{id}/files` | 201 | Create file/folder |
| `PUT` | `/api/v1/projects/{id}/files/content?path=...` | 200 | Save file content |
| `DELETE` | `/api/v1/projects/{id}/files?path=...` | 204 | Delete file/folder |

### Sessions (Containers)

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/projects/{id}/sessions` | 201 | Start session (create container) |
| `DELETE` | `/api/v1/sessions/{sessionId}` | 204 | Stop session (destroy container) |

### Web Server (Project Preview)

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/projects/{id}/web-server` | 201/200 | Start web server |
| `DELETE` | `/api/v1/projects/{id}/web-server` | 204 | Stop web server |
| `GET` | `/api/v1/projects/{id}/web-server` | 200 | Get server status |

### Git / Versioning

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/v1/projects/{id}/git/branches` | 200 | List branches |
| `POST` | `/api/v1/projects/{id}/git/branches` | 201 | Create branch |
| `DELETE` | `/api/v1/projects/{id}/git/branches/{name}` | 204 | Delete branch |
| `POST` | `/api/v1/projects/{id}/git/checkouts` | 200 | Checkout branch |
| `POST` | `/api/v1/projects/{id}/git/pushes` | 200 | Push to remote |
| `PUT` | `/api/v1/projects/{id}/git/remote` | 200 | Set remote URL |
| `GET` | `/api/v1/projects/{id}/git/commits` | 200 | List commits (paginated) |
| `POST` | `/api/v1/projects/{id}/git/commits` | 201 | Create commit |
| `GET` | `/api/v1/projects/{id}/git/diff` | 200 | Get working tree diff |
| `GET` | `/api/v1/projects/{id}/git/merge-requests` | 200 | List merge requests |
| `POST` | `/api/v1/projects/{id}/git/merge-requests` | 201 | Create merge request |
| `PATCH` | `/api/v1/projects/{id}/git/merge-requests/{mrId}` | 200 | Update MR status |

### Collaborators

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/v1/projects/{id}/collaborators` | 200 | List collaborators |
| `POST` | `/api/v1/projects/{id}/collaborators` | 201 | Invite collaborator |
| `PATCH` | `/api/v1/projects/{id}/collaborators/{userId}/role` | 200 | Update role |
| `DELETE` | `/api/v1/projects/{id}/collaborators/{userId}` | 204 | Remove collaborator |
| `GET` | `/api/v1/me/collaborations` | 200 | List my collaborations |
| `GET` | `/api/v1/me/invitations` | 200 | List my pending invitations |
| `POST` | `/api/v1/me/invitations/{id}/accept` | 200 | Accept invitation |
| `POST` | `/api/v1/me/invitations/{id}/reject` | 200 | Reject invitation |

### Teams

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/teams` | 201 | Create team |
| `GET` | `/api/v1/teams` | 200 | List my teams |
| `GET` | `/api/v1/teams/{id}` | 200 | Get team |
| `PATCH` | `/api/v1/teams/{id}` | 200 | Update team |
| `DELETE` | `/api/v1/teams/{id}` | 204 | Delete team |
| `GET` | `/api/v1/teams/{id}/members` | 200 | List members |
| `POST` | `/api/v1/teams/{id}/invitations` | 201 | Invite member |
| `DELETE` | `/api/v1/teams/{id}/members/{memberId}` | 204 | Remove member |
| `GET` | `/api/v1/teams/{id}/projects` | 200 | List team projects |
| `DELETE` | `/api/v1/teams/{id}/projects/{projectId}` | 204 | Unlink project |
| `PATCH` | `/api/v1/teams/{id}/settings` | 200 | Update team settings |
| `GET` | `/api/v1/teams/{id}/channels` | 200 | List channels |
| `POST` | `/api/v1/teams/{id}/channels` | 201 | Create channel |
| `DELETE` | `/api/v1/teams/{id}/channels/{channelId}` | 204 | Delete channel |

### Team Notes & Tasks

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/v1/teams/{id}/notes` | 200 | List notes |
| `POST` | `/api/v1/teams/{id}/notes` | 201 | Create note |
| `PUT` | `/api/v1/teams/{id}/notes/{noteId}` | 200 | Update note |
| `DELETE` | `/api/v1/teams/{id}/notes/{noteId}` | 204 | Delete note |
| `GET` | `/api/v1/teams/{id}/tasks` | 200 | List tasks |
| `POST` | `/api/v1/teams/{id}/tasks` | 201 | Create task |
| `PATCH` | `/api/v1/teams/{id}/tasks/{taskId}` | 200 | Update task |
| `DELETE` | `/api/v1/teams/{id}/tasks/{taskId}` | 204 | Delete task |

### Code Comments

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/v1/projects/{id}/comments?filePath=...` | 200 | List comments |
| `POST` | `/api/v1/projects/{id}/comments` | 201 | Create comment |
| `PATCH` | `/api/v1/projects/{id}/comments/{commentId}` | 200 | Resolve/update comment |

### Rooms (Meeting)

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/rooms` | 201 | Create room |
| `GET` | `/api/v1/rooms` | 200 | List active rooms |
| `GET` | `/api/v1/rooms/{id}` | 200 | Get room |
| `DELETE` | `/api/v1/rooms/{id}` | 204 | Delete room |
| `PATCH` | `/api/v1/rooms/{id}` | 200 | Update room (settings, host transfer) |
| `POST` | `/api/v1/rooms/{roomCode}/participants` | 200 | Join room by code |
| `POST` | `/api/v1/rooms/{id}/invitations` | 201 | Invite user to room |
| `POST` | `/api/v1/rooms/{id}/executions` | 202 | Run code in room |

### AI

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/ai/chat` | 200 | AI chat message |
| `POST` | `/api/v1/ai/completions` | 200 | Code autocomplete |
| `POST` | `/api/v1/ai/commit-messages` | 200 | Generate commit message |

### Chat

| Method | URL | Status | Description |
|---|---|---|---|
| `POST` | `/api/v1/chat/files/upload` | 201 | Upload chat file |
| `GET` | `/api/v1/chat/files/{fileName}` | 200 | Download chat file |
| `GET` | `/api/v1/conversations/{friendId}/messages` | 200 | Get DM history (paginated) |

### Workspace (Bootstrap)

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/v1/projects/{id}/workspace` | 200 | Aggregated bootstrap data |

### System

| Method | URL | Status | Description |
|---|---|---|---|
| `GET` | `/api/health` | 200 | Health check (no version prefix) |
| `POST` | `/api/v1/github/webhooks` | 200 | GitHub webhook receiver |

---

## The Interview Paragraph

> "I designed the Parallax API following strict REST resource-modelling principles. Every URL maps to a noun — projects, files, sessions, branches — never to verbs. The API uses URL-path versioning (`/api/v1/`) so we can evolve contracts without breaking existing clients. All error responses use a unified schema with machine-readable error codes, human-readable messages, request IDs for log correlation, and field-level validation details on 422 responses. For real-time features — collaborative editing, terminal I/O, chat — I designed a typed WebSocket protocol with a standard message envelope including message IDs for deduplication, protocol version for forward compatibility, and custom close codes (4000–4007) for actionable disconnect reasons. Every list endpoint is paginated — cursor-based for append-heavy data like chat messages and commits, offset-based for stable collections like team members. The API is fully documented via OpenAPI 3 with Springdoc, producing a live Swagger UI and a machine-readable spec that clients can code-generate against. Security headers include HSTS, CSP, request tracing via X-Request-ID, and CORS locked to the frontend origin."

---

> [!NOTE]
> **Total violations found**: 67 across 29 controllers. The four P0 items — versioning, error schema, pagination, and OpenAPI — represent the structural gaps. The URL naming violations are cosmetic compared to these four. Fix the P0s first; the URL renames can happen as part of the v1 migration.
