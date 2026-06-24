import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense } from "react";
import GlobalLoader from "./components/GlobalLoader";

import LandingPage from "./pages/LandingPage";
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Workspace = React.lazy(() => import("./pages/Workspace"));
const MeetingRoom = React.lazy(() => import("./pages/MeetingRoom"));
const TeamWorkspace = React.lazy(() => import("./pages/TeamWorkspace"));
const Profile = React.lazy(() => import("./pages/Profile"));
import Login from "./pages/Login";
import Signup from "./pages/Signup";
const About = React.lazy(() => import("./pages/About"));
const Features = React.lazy(() => import("./pages/Features"));
const Security = React.lazy(() => import("./pages/Security"));
const Roadmap = React.lazy(() => import("./pages/Roadmap"));
const Documentation = React.lazy(() => import("./pages/Documentation"));
const ApiDocs = React.lazy(() => import("./pages/ApiDocs"));
const Support = React.lazy(() => import("./pages/Support"));
const Status = React.lazy(() => import("./pages/Status"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Terms = React.lazy(() => import("./pages/Terms"));
import RequireAuth from "./auth/RequireAuth";
import OAuthSuccessPage from "./pages/0AuthSuccessPage";
import OAuthFailurePage from "./pages/OAuthFailurePage";
import Onboarding from "./pages/Onboarding";
import { Outlet } from "react-router-dom";
import { CollaborationProvider } from "./context/CollaborationContext";
import { VoiceProvider } from "./context/VoiceContext";
const MyProjects = React.lazy(() => import("./pages/MyProjects"));
const Rooms = React.lazy(() => import("./pages/Rooms"));
const Teams = React.lazy(() => import("./pages/Teams"));
const Friends = React.lazy(() => import("./pages/Friends"));
import DashboardLayout from "./components/layouts/DashboardLayout";
import { ProfileProvider } from "./context/ProfileContext";
import { Toaster } from "sonner";
import SmoothScroll from "./components/SmoothScroll";

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll />
      <Toaster position="top-center" richColors theme="dark" />
      <Suspense fallback={<GlobalLoader fullScreen={true} />}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/security" element={<Security />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/api" element={<ApiDocs />} />
        <Route path="/support" element={<Support />} />
        <Route path="/status" element={<Status />} />

        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Authenticated Routes with Collaboration Provider */}


        <Route element={
          <RequireAuth>
            <ProfileProvider>
              <CollaborationProvider>
                <DashboardLayout />
              </CollaborationProvider>
            </ProfileProvider>
          </RequireAuth>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/friends" element={<Friends />} />
          
          <Route element={<VoiceProvider><Outlet /></VoiceProvider>}>
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/workspace/:projectId" element={<Workspace />} />
            <Route path="/room/:roomCode" element={<MeetingRoom />} />
            <Route path="/team/:teamId" element={<TeamWorkspace />} />
            <Route path="/editor/:projectId" element={<Workspace />} />
          </Route>
          <Route path="/room" element={<Navigate to="/rooms" replace />} />
        </Route>

        {/* Auth (public) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Public Profile - No interactions but visible */}
        <Route path="/u/:username" element={<Profile />} />

        {/* OAuth callback (public) */}
        <Route path="/oauth-success" element={<OAuthSuccessPage />} />
        <Route path="/oauth-failure" element={<OAuthFailurePage />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
