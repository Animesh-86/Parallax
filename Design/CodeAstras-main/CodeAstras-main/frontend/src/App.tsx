import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FeaturesGallery } from "./components/FeaturesGallery";
import { InteractiveCodeBlock } from "./components/InteractiveCodeBlock";
import { CollaborationNebula } from "./components/CollaborationNebula";
import { PricingSection } from "./components/PricingSection";
import { Footer } from "./components/Footer";
import { CosmicBackground } from "./components/CosmicBackground";
import { ThematicFloatingElements } from "./components/ThematicFloatingElements";
import { ScrollProgress } from "./components/ScrollProgress";
import { InteractiveCosmicStars } from "./components/InteractiveCosmicStars";
import { useState, useEffect } from "react";
import Workspace from "./Workspace";
import Dashboard from "./Dashboard";
import MeetingRoom from "./MeetingRoom";
import TeamWorkspace from "./TeamWorkspace";
import Profile from "./Profile";
import Login from "./Login";
import Signup from "./Signup";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Show login page
  if (currentPath === '/login') {
    return <Login />;
  }

  // Show signup page
  if (currentPath === '/signup') {
    return <Signup />;
  }

  // Show profile page
  if (currentPath === '/profile') {
    return <Profile />;
  }

  // Show team workspace
  if (currentPath === '/team') {
    return <TeamWorkspace />;
  }

  // Show meeting room
  if (currentPath === '/room') {
    return <MeetingRoom />;
  }

  // Show dashboard
  if (currentPath === '/dashboard') {
    return <Dashboard />;
  }

  // Show workspace
  if (currentPath === '/workspace') {
    return <Workspace />;
  }

  // Show landing page
  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <ScrollProgress />
      <CosmicBackground />
      <ThematicFloatingElements />
      <InteractiveCosmicStars />
      
      <div className="relative z-10">
        <Header />
        <HeroSection />
        <FeaturesGallery />
        <InteractiveCodeBlock />
        <CollaborationNebula />
        <PricingSection />
        <Footer />
      </div>
    </div>
  );
}