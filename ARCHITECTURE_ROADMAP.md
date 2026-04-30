# Parallax Architecture & Scaling Roadmap

This document outlines the current architectural state of the Parallax application (which is optimized as a prototype/MVP) and provides a roadmap for migrating to a distributed, highly-available, and horizontally scalable production system. 

As the application grows from a single-node deployment to a multi-instance cloud environment (e.g., Kubernetes, AWS ECS), the following technical debt and architectural bottlenecks must be addressed.

---

## 1. WebSocket Infrastructure (The Split-Brain Problem)

### Current State
WebSockets are currently powered by Spring's `SimpleBroker` (`config.enableSimpleBroker()`). This is an in-memory message broker that stores active WebSocket sessions locally on the JVM heap.

### The Bottleneck
If Parallax is scaled horizontally behind a load balancer (e.g., 2 backend instances), User A connected to Instance 1 will not receive code edits or chat messages from User B connected to Instance 2.

### Future Architecture
- **Distributed Pub/Sub**: Replace the in-memory broker with a distributed broker like **Redis Pub/Sub** or **RabbitMQ**.
- **Implementation**: Configure Spring WebSocket to use `enableStompBrokerRelay()`. This ensures all instances share the same WebSocket event bus, broadcasting messages across the entire cluster.

---

## 2. Code Execution Engine

### Current State
The `RunCodeService.java` relies on standard Java `ProcessBuilder` to spin up local Docker containers on the backend server. It mounts the local JVM filesystem (`jobDir`) into the container to execute code.

### The Bottleneck
This tightly couples the backend API server to the Docker Daemon and the local disk. In a cloud environment, you cannot easily mount local disk files into a Docker container unless you run Docker-in-Docker (DinD), which introduces severe security and operational complexities. Additionally, executing code on the main API node consumes compute resources that can crash the API under heavy load.

### Future Architecture
- **Distributed Worker Pool**: Offload code execution to a separate, isolated worker cluster.
- **Implementation Options**:
  - **Kubernetes Jobs**: When a user clicks "Run", the API creates a short-lived K8s Job with an ephemeral volume to execute the code.
  - **gRPC Sandbox Service**: Extract the execution logic into a standalone microservice written in Go or Rust that manages Firecracker microVMs or Docker containers.

---

## 3. Persistent File Storage

### Current State
Avatars and synced project files are saved directly to the backend's local file system (e.g., defined in `parallax.storage.avatars`). 

### The Bottleneck
In modern cloud deployments, application instances are ephemeral. If a pod restarts, all locally stored avatars and files are permanently deleted. Furthermore, a user fetching an avatar from Instance B will get a 404 if the avatar was originally uploaded to Instance A.

### Future Architecture
- **Object Storage Layer**: Migrate the `FileStorageService` to an S3-compatible blob storage.
- **Implementation**: Use Amazon S3, Google Cloud Storage, or MinIO. Update the frontend to consume Pre-Signed URLs rather than passing through the backend server.

---

## 4. Database Query Patterns (N+1 Problems)

### Current State
In services like `TeamServiceImpl.getMyTeams()`, the system fetches a list of teams, iterates through them, and fires off secondary queries inside the loop (e.g., `teamMemberRepository.findByTeam_IdAndUser_Id()`).

### The Bottleneck
This is a classic N+1 query problem. If a user is a member of 50 teams, the application makes 50 individual round-trips to the database to check membership statuses. Under high traffic, this will exhaust the database connection pool.

### Future Architecture
- **Optimized JPA Queries**: Refactor Spring Data JPA repositories to fetch relationships in a single query.
- **Implementation**: Use `JOIN FETCH` queries, `@EntityGraph`, or standard `IN` clauses to batch load relational data efficiently.

---

## 5. Synchronous Domain Events

### Current State
When a user accepts a team invitation (`autoSyncMemberToTeamProjects`), the Team Service manually queries all projects in that team and saves `ProjectCollaborator` records synchronously.

### The Bottleneck
Tight domain coupling. The Team Service handles Project Service responsibilities. If a team has 1,000 projects, this transaction will take a long time to commit, blocking the HTTP thread and slowing down the user experience.

### Future Architecture
- **Event-Driven Architecture (EDA)**: Decouple domain services using asynchronous events.
- **Implementation**: 
  - Use Spring `@Async` ApplicationEvents (or a message queue like Kafka/RabbitMQ) for domain events.
  - The Team Service simply publishes a `TeamMemberJoinedEvent`. A separate listener catches the event and processes the project associations asynchronously without blocking the API response.

---

*Document created to track MVP technical debt and future scaling milestones.*
