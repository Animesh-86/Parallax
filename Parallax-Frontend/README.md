# Parallax 

**Parallax** is a next-generation real-time collaborative coding platform designed to blend the best of IDE capability with seamless social communication. Think of it as "Google Docs for Code" meets "Discord".

## Key Features

### Real-time Collaborative Workspace
- **Monaco Editor Integration**: Full-featured code editor experience (VS Code-like).
- **Multi-file Support**: Create, edit, and reorganize files in a virtual file system.
- **Terminal Integration**: Integrated terminal window for output and commands.

### Voice & Video Collaboration ("Live Session")
- **Crystal Clear Voice**: Low-latency voice chat powered by WebRTC.
- **Live Video**: See your team members while you code.
- **Active Speaker Detection**: Visual indicators (cyan borders, glow effects) for who is talking.
- **Toolbar Controls**: Integrated mute, video toggle, and join/leave controls directly in the workspace side panel.
- **Visual Feedback**: "Live Session" indicators and participant grids.

### Social & Teams
- **Friends System**: Add collaborative partners and see their online status.
- **Teams & Rooms**: Organize projects into Teams and create persistent Rooms for sprints or casual coding.
- **Dashboard**: Central hub for managing projects, viewing recent activity, and accessing teams.

## Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) / Shadcn-like primitives
- **Icons**: [Lucide React](https://lucide.dev/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)

### Communication Infrastructure
- **WebSocket**: STOMP / SockJS for real-time signaling.
- **WebRTC**: Peer-to-Peer audio and video streaming.
- **Signaling**: Custom backend signaling service (Spring Boot).

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository** (if applicable)
   ```bash
   git clone https://github.com/yourusername/Parallax-frontend.git
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── layouts/      # Dashboard and Workspace layouts
│   │   ├── ui/           # Generic UI primitives (Buttons, Inputs, etc.)
│   │   └── workspace/    # Workspace-specific components (Editor, Terminal, VoicePanel)
│   ├── context/          # React Contexts (VoiceContext, AuthContext, CollabContext)
│   ├── pages/            # Main application pages (Dashboard, Profile, Workspace)
│   ├── services/         # API and WebSocket services (wsVoice.ts, api.ts)
│   └── App.tsx           # Main application entry point and routing
└── public/               # Static assets
```

## Authentication
The application uses JWT-based authentication. Ensure you have a valid backend running or appropriate mock tokens for testing protected routes.

---
*Built by the Parallax Team*
