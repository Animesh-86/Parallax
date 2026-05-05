# Parallax Frontend

The Parallax frontend is a high-performance React application that provides the immersive, real-time user interface for the platform. It's built for speed, responsiveness, and premium aesthetics.

## Key Modules

- **🎨 Immersive Workspace**: Feature-rich IDE interface with Monaco editor integration and real-time collaboration.
- **📈 Dynamic Dashboards**: Personalized views for projects, teams, and active meeting rooms.
- **📞 Communication Center**: Integrated voice/video call overlays and unified chat panels.
- **🏆 Gamification UI**: Leveling bars, XP notifications, and badge showcases.
- **🔐 Secure Auth Flows**: Seamless onboarding with JWT persistence and OAuth2 redirects.

## Tech Stack

- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4 + Framer Motion (for micro-animations)
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Real-time**: SockJS-client + STOMP.js + Native WebSockets
- **UI Components**: Radix UI + Lucide Icons

## Directory Architecture

- `src/components`: Atomized UI components, feature-specific modules (Chat, Workspace, Modals).
- `src/context`: Global state management for Collaboration, Auth, and Theme.
- `src/pages`: Route-level page components (Workspace, Dashboard, Teams).
- `src/services`: API clients (Axios) and WebSocket client managers.
- `src/styles`: Global CSS, Tailwind configurations, and design tokens.

## Service Layer Details

The frontend communicates with the backend through three primary channels:

1.  **REST API (`src/services/api.ts`)**: Standard CRUD operations for projects, teams, and profiles.
2.  **STOMP Client (`src/context/CollaborationContext.tsx`)**: Handles cursor tracking, code sync, and platform events.
3.  **High-Performance Chat (`src/services/wsChatClient.ts`)**: Dedicated raw WebSocket connections for sub-millisecond chat latency.

## Local Development

```bash
# Navigate to frontend module
cd Parallax-Frontend/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=ws://localhost:8080
VITE_OAUTH_BASE_URL=http://localhost:8080
```

## Production Build

```bash
npm run build
```

The optimized assets will be generated in the `dist/` (or `build/`) folder.

## UI/UX Standards

- **Responsive Design**: Fully functional across desktop and tablet breakpoints.
- **Micro-animations**: Use Framer Motion for smooth transitions between states.
- **Aesthetics**: Follow the "Cosmic Dark" design system (Dark mode by default with gold/silver accents).

## License

Refer to repository-level licensing and policy documentation.
