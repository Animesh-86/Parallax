import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import MeetingRoom from "./pages/MeetingRoom";
import TeamWorkspace from "./pages/TeamWorkspace";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Security from "./pages/Security";
import Roadmap from "./pages/Roadmap";
import Documentation from "./pages/Documentation";
import ApiDocs from "./pages/ApiDocs";
import Support from "./pages/Support";
import Status from "./pages/Status";
import Contact from "./pages/Contact";
import RequireAuth from "./auth/RequireAuth";
import OAuthSuccessPage from "./pages/0AuthSuccessPage";
import CodeEditor from "./components/workspace/CodeEditor";
import { Outlet } from "react-router-dom";
import { CollaborationProvider } from "./context/CollaborationContext";
import { VoiceProvider } from "./context/VoiceContext";
import MyProjects from "./pages/MyProjects";
import Rooms from "./pages/Rooms";
import Teams from "./pages/Teams";
import Friends from "./pages/Friends";
import DashboardLayout from "./components/layouts/DashboardLayout";




import { Toaster } from "sonner";
import SmoothScroll from "./components/SmoothScroll";

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll />
      <Toaster position="top-center" richColors theme="dark" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/security" element={<Security />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/api" element={<ApiDocs />} />
        <Route path="/support" element={<Support />} />
        <Route path="/status" element={<Status />} />

        <Route path="/contact" element={<Contact />} />


        {/* Authenticated Routes with Collaboration Provider */}


        <Route element={
          <RequireAuth>
            <CollaborationProvider>
              <VoiceProvider>
                <DashboardLayout />
              </VoiceProvider>
            </CollaborationProvider>
          </RequireAuth>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:projectId" element={<Workspace />} />
          <Route path="/room" element={<Navigate to="/rooms" replace />} />
          <Route path="/room/:roomCode" element={<MeetingRoom />} />
          <Route path="/team" element={<TeamWorkspace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/editor/:projectId" element={<Workspace />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/friends" element={<Friends />} />
        </Route>

        {/* Auth (public) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Public Profile - No interactions but visible */}
        <Route path="/u/:username" element={<Profile />} />

        {/* OAuth callback (public) */}
        <Route path="/oauth-success" element={<OAuthSuccessPage />} />
      </Routes>
    </BrowserRouter>
  );
}
