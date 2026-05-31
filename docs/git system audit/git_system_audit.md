# Parallax Git & GitHub System — Deep Audit

> **Auditor perspective:** Principal Engineer, reviewing for production-readiness, security, correctness, and feature completeness.

---

## Files Reviewed

| Layer | Files |
|-------|-------|
| Backend Service | [GitHubService.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/github/GitHubService.java), [VersioningService.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/VersioningService.java), [AiReviewService.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/ai/AiReviewService.java) |
| Backend Controller | [VersioningController.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java), [GitHubWebhookController.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/github/GitHubWebhookController.java) |
| Entities | [ProjectCommit.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/entity/project/ProjectCommit.java), [ProjectBranch.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/entity/project/ProjectBranch.java), [MergeRequest.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/entity/project/MergeRequest.java) |
| Repositories | `ProjectBranchRepository`, `ProjectCommitRepository`, `MergeRequestRepository` |
| DTOs | `ProjectBranchResponse`, `ProjectCommitResponse`, `MergeRequestResponse` |
| Frontend | [ActivityPanel.tsx](file:///C:/CipherVault/Code/Projects/Parallax/frontend/src/components/workspace/ActivityPanel.tsx), [CreatePullRequestModal.tsx](file:///C:/CipherVault/Code/Projects/Parallax/frontend/src/components/workspace/CreatePullRequestModal.tsx), [versioningApi.ts](file:///C:/CipherVault/Code/Projects/Parallax/frontend/src/services/versioningApi.ts) |
| Security | [SecurityConfig.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/SecurityConfig.java) |

---

## 🔴 Critical Bugs / Security Vulnerabilities

### 1. Webhook Has ZERO Authentication (CVE-class)

> [!CAUTION]
> [GitHubWebhookController.java:L19-L40](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/github/GitHubWebhookController.java#L19-L40) — The `X-Hub-Signature-256` header is received but **never validated**. Any attacker can POST a forged payload to `/api/github/webhooks` and trigger AI reviews, team channel spam, or resource exhaustion.

**Impact:** An attacker can inject arbitrary PR review comments into any project that has `aiReviewEnabled=true`, or trigger denial-of-service by flooding the AI service.

**Fix:** Validate the HMAC-SHA256 signature against a stored webhook secret. Add a `github.webhook-secret` config property and verify the payload hash before processing.

---

### 2. GitHub PAT Leaked in Git Remote URL

> [!CAUTION]
> [VersioningService.java:L208](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/VersioningService.java#L208) — The PAT is embedded directly in the remote URL: `https://{PAT}@github.com/...`. This token is then stored in plaintext inside the `.git/config` file on disk. Any user with terminal access to the workspace container can run `git remote -v` and steal the PAT.

**Impact:** Full read/write access to ALL repositories the PAT has access to.

**Fix:** Use `git credential-store` or pass credentials via `GIT_ASKPASS` environment variable. Alternatively, use a short-lived installation token from a GitHub App instead of a long-lived PAT.

---

### 3. Single Global PAT for ALL Users

> [!WARNING]
> The entire system uses a single `github.pat` from `application.properties` for every user's push/pull/import/PR operations. This means:
> - User A's commits are pushed with User B's (or the admin's) GitHub identity
> - There is no per-user OAuth token exchange
> - Rate limits are shared across all users (GitHub API has 5000 req/hr per PAT)

**Fix:** Implement per-user GitHub OAuth token storage. When a user connects GitHub, store their personal access token (encrypted) in the database, and use it for their operations.

---

### 4. Command Injection via Branch Name

> [!CAUTION]
> [VersioningService.java:L116](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/VersioningService.java#L116) — Branch names flow directly from user input (`@RequestBody`) into `ProcessBuilder` arguments: `"checkout", "-b", name`. While `ProcessBuilder` is safer than `Runtime.exec(String)`, a branch name like `--` or `-f` could be interpreted as git flags.

Also in [VersioningController.java:L42](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/controller/project/VersioningController.java#L42), the only validation is `name.isEmpty()` — no regex validation for valid git ref names.

**Fix:** Validate branch names against git ref-name rules: no spaces, no `..`, no `~`, no `^`, no `:`, no `\`, no `[`, must not start with `-`, must not end with `.lock`.

---

### 5. Webhook Endpoint Requires Authentication (Broken)

> [!WARNING]
> [SecurityConfig.java:L124](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/SecurityConfig.java#L124) — The catch-all `.anyRequest().authenticated()` means `/api/github/webhooks` requires a JWT token. But GitHub sends webhooks without any JWT — they only send `X-Hub-Signature-256`. This means **webhooks from GitHub are being rejected with 401/403**.

**Fix:** Add `.requestMatchers("/api/github/webhooks").permitAll()` to the security config, but ONLY after implementing HMAC signature validation (Bug #1).

---

## 🟡 Significant Bugs / Logic Errors

### 6. `createCommit` Silently Fails When There Are No Changes

[VersioningService.java:L166-L167](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/VersioningService.java#L166-L167) — `git add . && git commit -m "..."` will fail with exit code 1 if there's nothing to commit, but `runGitCommand()` swallows the error and returns empty string. The response still returns a commit object with `HEAD` hash, which may be the *previous* commit — creating a phantom duplicate in the UI.

**Fix:** Check the output of `git status --porcelain` before committing. If empty, return an error response to the user: "Nothing to commit."

---

### 7. `getSystemUserOrDummy()` Is a Time Bomb

[VersioningService.java:L337](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/VersioningService.java#L337) — `userRepository.findAll().stream().findFirst().orElse(null)` fetches a **random** user from the database and assigns them as the "author" of git log entries. This is incorrect attribution and will break if the user table is empty (NPE on `getFullName()`).

**Fix:** Parse the git commit author email and attempt to match it against the `users` table. Fall back to displaying the raw author name from git log without fabricating a userId.

---

### 8. `buildBranchResponse` Always Returns `Instant.now()` as Creation Time

[VersioningService.java:L147](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/VersioningService.java#L147) — Every branch response has `createdAt = Instant.now()` regardless of when the branch was actually created. The frontend shows "just now" for every branch.

**Fix:** Parse git reflog or use `git log -1 --format=%aI <branchName>` to get the actual creation/first-commit timestamp.

---

### 9. `createPullRequest` Base Branch Detection Is Fragile

[GitHubService.java:L225](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/github/GitHubService.java#L225) — The base branch for a PR is determined by checking if `refUrl` ends with "main": `refUrl.endsWith("main") ? "main" : "master"`. But `refUrl` was potentially overwritten in the catch block (L168) — so if the initial request to `main` failed and we fell back to `master`, `refUrl` now points to `master`, but the `endsWith("main")` check still evaluates against the new URL, correctly returning "master". However, if the repo uses a different default branch (e.g., `develop`, `trunk`), the system breaks entirely.

**Fix:** Use the GitHub API `GET /repos/{owner}/{repo}` and read `default_branch` from the response.

---

### 10. Import Treats All Files as UTF-8 Text

[GitHubService.java:L118](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/github/GitHubService.java#L118) — Binary files (images, compiled assets, `.jar`, `.woff`) are read as UTF-8 strings and stored in the `content` TEXT column. This corrupts the data and may crash PostgreSQL with encoding errors despite the null-byte cleanup on L121.

**Fix:** Detect binary files (check for null bytes in first 8KB, or check file extension against a known binary list). Store binary files on disk/S3 only, not in the TEXT column.

---

### 11. Dead JPA Entities — `ProjectBranch` and `ProjectCommit` Tables Are Never Used

The JPA entities [ProjectBranch.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/entity/project/ProjectBranch.java) and [ProjectCommit.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/entity/project/ProjectCommit.java) exist with full database tables, repositories, and indexes — but `VersioningService` completely bypasses them. It runs real `git` commands and builds DTOs manually. The DB entities are dead code, creating phantom tables that are never written to.

**Fix:** Either remove the dead entities/repos/tables, or migrate to a hybrid model where git operations write audit records to the DB for queryability.

---

### 12. Race Condition on `git checkout`

[VersioningService.java:L120-L122](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/project/VersioningService.java#L120-L122) — If two users commit or push to different branches on the same project simultaneously, they'll fight over `git checkout`, causing one to commit to the wrong branch or get merge conflicts.

**Fix:** Use `git worktree` for per-branch isolation, or use git plumbing commands (`git write-tree`, `git commit-tree`) that don't require checkout.

---

## 🟢 Feature Gaps (Opportunities)

### What We Should Add

| Priority | Feature | Why |
|----------|---------|-----|
| **P0** | Per-user GitHub OAuth tokens | Users need to authenticate with their own GitHub accounts |
| **P0** | Webhook HMAC validation | Security prerequisite for production |
| **P1** | `git pull` / Sync from remote | Currently we can push but can't pull updates from upstream |
| **P1** | Diff viewer in PR review | CloudLab (from your screenshot) has Editor/Preview/Diff tabs. We need a side-by-side diff view for internal merge requests |
| **P1** | File-level change tracking | Show which files changed in each commit (like `git diff --stat`) |
| **P1** | Conflict resolution UI | When merging branches, show conflicts inline in Monaco editor |
| **P2** | Git blame / line history | Show who last modified each line in the editor gutter |
| **P2** | `.gitignore` support | Auto-generate based on project type, respect during `git add` |
| **P2** | Stash support | `git stash` / `git stash pop` for switching branches with uncommitted changes |
| **P2** | Branch protection rules | Prevent direct commits to `main`, require PR review |
| **P3** | Commit graph visualization | Visual branch/merge graph like GitKraken or GitHub Network |
| **P3** | GitHub Issues integration | Show linked issues in the Git panel |
| **P3** | Multiple remote support | Support GitLab, Bitbucket alongside GitHub |

---

## Architecture Diagram (Current State)

```mermaid
graph TD
    subgraph Frontend
        AP[ActivityPanel.tsx] -->|REST| VC[VersioningController]
        PRM[CreatePullRequestModal] -->|REST| PC[ProjectController]
    end

    subgraph Backend
        VC -->|delegates| VS[VersioningService]
        PC -->|delegates| GHS[GitHubService]
        
        VS -->|ProcessBuilder| GIT[git CLI on disk]
        VS -->|JPA| MRR[(MergeRequest Table)]
        
        GHS -->|REST API| GHAPI[GitHub API v3]
        GHS -->|@Async| ARS[AiReviewService]
        ARS -->|Spring AI| LLM[LLM Model]
        ARS -->|REST API| GHAPI
    end

    subgraph Webhook
        GH[GitHub.com] -->|POST /api/github/webhooks| WHC[GitHubWebhookController]
        WHC --> GHS
    end

    subgraph Dead Code
        PBR[(project_branches table)] -.->|UNUSED| X1[Never written]
        PCR[(project_commits table)] -.->|UNUSED| X2[Never written]
    end

    style Dead Code fill:#330000,stroke:#660000,color:#ff6666
    style Webhook fill:#1a1a00,stroke:#666600,color:#ffff66
```

---

## Summary of Findings

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 5 | Webhook auth bypass, PAT leak, command injection, single global PAT, broken webhook route |
| 🟡 Significant | 7 | Silent commit failure, wrong author attribution, stale timestamps, fragile base branch, binary corruption, dead entities, race condition |
| 🟢 Feature Gap | 13 | Pull/sync, diff viewer, conflict UI, blame, gitignore, stash, branch protection, etc. |

> [!IMPORTANT]
> The top 3 items to fix before any production deployment:
> 1. **Webhook HMAC validation** + permitAll route fix
> 2. **Per-user GitHub OAuth** (replace global PAT)
> 3. **Branch name sanitization** (prevent injection)
