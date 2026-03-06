import { useState, useEffect, useMemo, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, Settings, PhoneOff, Phone } from 'lucide-react';
import { useVoice } from '../../context/VoiceContext';
import { useCollab } from '../../context/CollaborationContext';
import { cn } from '../../components/ui/utils';
import { jwtDecode } from "jwt-decode";
import { useParams } from 'react-router-dom';

interface VideoPanelProps {
  mode: 'video' | 'audio';
  onModeChange: (mode: 'video' | 'audio') => void;
}

// Internal Video Player Component
const VideoPlayer = ({ stream, isMe = false }: { stream?: MediaStream | null, isMe?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMe} // Mute self to prevent feedback
      className={cn(
        "w-full h-full object-cover",
        isMe && "transform scale-x-[-1]" // Restored: Self-view should be mirrored (Discord style)
      )}
    />
  );
};

export function VideoPanel({ mode, onModeChange }: VideoPanelProps) {
  const { projectId } = useParams();
  const {
    isConnected,
    isMuted,
    toggleMute,
    leaveCall,
    activeSpeakers,
    joinCall,
    toggleVideo,
    isVideoEnabled,
    localStream,
    remoteStreams
  } = useVoice();

  const { currentCollaborators } = useCollab();
  const [cameraOn, setCameraOn] = useState(false);
  const [myId, setMyId] = useState<string>("");

  useEffect(() => {
    setCameraOn(isVideoEnabled);
  }, [isVideoEnabled]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setMyId(decoded.userId || decoded.sub);
      } catch (e) {
        console.error("Failed to decode token in VideoPanel");
      }
    }
  }, []);

  const handleToggleCam = () => {
    toggleVideo();
  };

  const participants = useMemo(() => {
    // 1. Find "Me"
    const safeCollaborators = Array.isArray(currentCollaborators) ? currentCollaborators : [];
    const meCollaborator = safeCollaborators.find(c => c?.userId === myId) || {
      userId: myId,
      email: 'Me',
      role: 'VIEWER'
    };

    const myProfile = {
      id: myId,
      name: meCollaborator.email.split('@')[0],
      avatar: meCollaborator.email.substring(0, 2).toUpperCase(),
      color: '#94A3B8',
      isMe: true,
      stream: localStream
    };

    // 2. Find Others (Connected Peers)
    const activePeers = Array.from(remoteStreams.keys());

    const otherProfiles = activePeers.map(peerId => {
      const collaborator = safeCollaborators.find(c => c?.userId === peerId);
      return {
        id: peerId,
        name: collaborator ? collaborator.email.split('@')[0] : `User ${peerId.substring(0, 4)}`,
        avatar: collaborator ? collaborator.email.substring(0, 2).toUpperCase() : '??',
        color: '#7DD3FC',
        isMe: false,
        stream: remoteStreams.get(peerId)
      };
    });

    return [myProfile, ...otherProfiles];
  }, [currentCollaborators, remoteStreams, localStream, myId]);


  // Logic to determine main speaker
  // Prioritize active remote speaker -> First remote user -> Only then Me
  const activeRemote = activeSpeakers.find(id => id !== myId);
  const firstRemote = participants.find(p => !p.isMe);

  // Rule: If there is an active remote speaker, show them.
  // Else if there are ANY remote participants, show the first one (pinned view).
  // Else show me.
  const mainSpeakerId = activeRemote || (firstRemote ? firstRemote.id : myId);
  const mainSpeaker = participants.find(p => p.id === mainSpeakerId) || participants[0];

  // Others list should include everyone NOT the main speaker
  const others = participants.filter(p => p.id !== mainSpeaker.id);

  return (
    <div className="flex flex-col h-full bg-[#060910] relative font-sans">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-white/5 bg-[#060910]">
        <span className="text-xs font-semibold tracking-wide text-white/60">VIDEO & VOICE</span>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-[#4ADE80] animate-pulse" : "bg-[#EF6461]")} />
          <span className="text-sm font-medium text-white/90">
            {isConnected ? "Live Session" : "Disconnected"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
          <span className="text-xs font-medium">{participants.length}</span>
          <span className="text-[10px] uppercase">users</span>
        </div>
      </div>

      <div className="flex-1 px-4 pb-20 overflow-y-auto space-y-3">

        {!isConnected && (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <MicOff className="w-12 h-12 mb-2" />
            <p className="text-sm">Join to start talking</p>
          </div>
        )}

        {isConnected && (
          <>
            {/* Active Speaker / Main Card */}
            <div
              className={cn(
                "relative w-full bg-[#162032] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                activeSpeakers.includes(mainSpeaker.id)
                  ? "border-[2px] border-[#94A3B8] shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "border border-white/5"
              )}
              style={{ aspectRatio: "4/3", minHeight: "200px" }}
            >

              {/* Video / Avatar */}
              {mainSpeaker.stream && mainSpeaker.stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live') ? (
                <VideoPlayer stream={mainSpeaker.stream} isMe={mainSpeaker.isMe} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#162032]">
                  <div className={cn(
                    "w-28 h-28 rounded-full border-[2px] flex items-center justify-center text-4xl font-light tracking-wider bg-[#0C1220] shadow-xl",
                    activeSpeakers.includes(mainSpeaker.id) ? "border-[#94A3B8] text-[#2DD4BF]" : "border-white/10 text-white/40"
                  )}>
                    {mainSpeaker.avatar}
                  </div>
                </div>
              )}

              {/* Floating Labels */}
              <div className="absolute bottom-4 left-4 z-20">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 shadow-sm">
                  <span className="text-sm font-medium text-white/90">{mainSpeaker.name}</span>
                  {mainSpeaker.isMe && <span className="text-[10px] text-white/50 bg-white/10 px-1.5 rounded uppercase tracking-wider">You</span>}
                </div>
              </div>

              <div className="absolute top-4 right-4 z-20">
                <div className={cn(
                  "w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors",
                  !isMuted && mainSpeaker.isMe ? "bg-white/10 border-white/10" : "bg-black/60 border-white/5"
                )}>
                  {!isMuted && mainSpeaker.isMe ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white/50" />}
                </div>
              </div>
            </div>

            {/* Grid for Others */}
            <div className="grid grid-cols-2 gap-3">
              {others.map(p => (
                <div
                  key={p.id}
                  className={cn(
                    "relative w-full bg-[#162032] rounded-xl overflow-hidden transition-all duration-300",
                    activeSpeakers.includes(p.id)
                      ? "border-[2px] border-[#94A3B8] shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                      : "border border-white/5 hover:border-white/10"
                  )}
                  style={{ aspectRatio: "16/9", minHeight: "80px" }}
                >
                  {p.stream && p.stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live') ? (
                    <VideoPlayer stream={p.stream} isMe={p.isMe} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#162032]">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-medium bg-[#0C1220]",
                          activeSpeakers.includes(p.id) ? "border-[#94A3B8] text-[#2DD4BF]" : "border-white/10 text-white/40"
                        )}
                        style={!activeSpeakers.includes(p.id) ? { borderColor: p.color, color: p.color } : {}}
                      >
                        {p.avatar}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 z-20">
                    <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-white/90">{p.name}</span>
                      {p.isMe && <span className="text-[9px] text-white/50">(You)</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-[#0C1220]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl z-20">
        <button
          onClick={toggleMute}
          disabled={!isConnected}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            !isConnected ? "opacity-50 cursor-not-allowed bg-white/5 text-white/40" :
              isMuted ? "bg-[#EF6461]/20 text-[#EF6461] hover:bg-[#EF6461]/30" : "bg-white/5 text-white/80 hover:bg-white/10"
          )}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={handleToggleCam}
          disabled={!isConnected}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            !isConnected ? "opacity-50 cursor-not-allowed bg-white/5 text-white/40" :
              !cameraOn ? "bg-white/5 text-white/80 hover:bg-white/10" : "bg-white/10 text-white"
          )}
        >
          {!cameraOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/80 hover:bg-white/10 transition-all">
          <Monitor className="w-5 h-5" />
        </button>

        <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/80 hover:bg-white/10 transition-all">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {isConnected ? (
          <button
            onClick={() => leaveCall(true)}
            title="Leave Call"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EF6461]/80 hover:bg-[#EF6461] text-white shadow-lg shadow-[#EF6461]/20 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => projectId && joinCall(projectId)}
            title="Join Call"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#4ADE80] hover:bg-[#4ADE80] text-white shadow-lg shadow-[#4ADE80]/30 transition-all animate-pulse"
          >
            <div className="relative">
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
              <Phone className="w-5 h-5 fill-current" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}