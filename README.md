
# Parallax

Parallax is a modular collaboration platform for building, reviewing, and running code together in a shared workspace. The repository contains the backend, frontend, and supporting assets used by the product.

## Repository Layout

- [Parallax-Backend](Parallax-Backend) - Java Spring Boot backend that provides authentication, REST APIs, WebSocket collaboration, file/project services, and room management.
- [Parallax-Frontend](Parallax-Frontend) - React and TypeScript frontend for the dashboard, workspace, meeting room, and collaborative tooling.
- [parallax-python-runner](Parallax-Backend/parallax-python-runner) - Python-based execution helpers and runner containers used for code execution features.
- [Design](Design) - Archived design assets, prototypes, and reference material.

## Core Capabilities

- Real-time room collaboration with chat, voice, screen sharing, code, tasks, and whiteboard features
- Configurable room modes for interview and team workflows
- Authentication and authorization across the workspace and meeting experience
- File and project handling for shared development sessions
- Separate frontend and backend applications for independent development and deployment

## Prerequisites

- Java 17 or later
- Node.js 18 or later
- Maven Wrapper or Maven
- A browser for the frontend application

## Local Development

Start the backend from `Parallax-Backend/backend`:

```bash
./mvnw spring-boot:run
```

Start the frontend from `Parallax-Frontend/frontend`:

```bash
npm install
npm run dev
```

Environment-specific values are configured through the backend and frontend `.env` or application property files. See the module-level README files for detailed setup and runtime notes.

## Notes

- The root `Design` directory is kept as archived reference material and is not required for normal application execution.
- The backend and frontend are developed independently, so changes in one module may require a corresponding API or configuration update in the other.

## Contributing

Contributions are welcome. Please open an issue or pull request with a clear description of the change, the motivation, and any validation that was performed.

## License

This project is licensed under the MIT License.
