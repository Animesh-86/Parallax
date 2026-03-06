import { useState } from 'react';
import { Video, Mic, MicOff, VideoOff, Share2, PhoneOff, Monitor, Users, Settings } from 'lucide-react';

interface VideoPanelProps {
  mode: 'video' | 'audio';
  onModeChange: (mode: 'video' | 'audio') => void;
}

export function VideoPanel({ mode, onModeChange }: VideoPanelProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(2);

  const participants = [
    { id: 1, name: 'You', avatar: 'YO', color: '#7c3aed', speaking: false },
    { id: 2, name: 'Alex Chen', avatar: 'AC', color: '#0ea5e9', speaking: true },
    { id: 3, name: 'Sarah Kim', avatar: 'SK', color: '#06b6d4', speaking: false },
    { id: 4, name: 'Mike Ross', avatar: 'MR', color: '#8b5cf6', speaking: false },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-white/90">Live Session</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">{participants.length}</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        {mode === 'video' ? (
          <div className="space-y-3">
            {/* Main/Active Speaker - Larger */}
            <div className="relative aspect-video bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 group hover:border-[#7c3aed]/50 transition-all">
              {/* Video feed placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/5 to-[#0ea5e9]/5" />
              
              {/* Avatar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center border-2 shadow-lg"
                  style={{
                    backgroundColor: `${participants[activeSpeaker - 1].color}15`,
                    borderColor: participants[activeSpeaker - 1].color,
                    color: participants[activeSpeaker - 1].color,
                    fontSize: '28px',
                    fontWeight: '600'
                  }}
                >
                  {participants[activeSpeaker - 1].avatar}
                </div>
              </div>

              {/* Name badge */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-sm text-white/90">{participants[activeSpeaker - 1].name}</span>
              </div>

              {/* Speaking indicator */}
              {participants[activeSpeaker - 1].speaking && (
                <div 
                  className="absolute inset-0 border-2 rounded-2xl pointer-events-none animate-pulse"
                  style={{ borderColor: '#06b6d4' }}
                />
              )}

              {/* Mic status */}
              <div className="absolute top-3 right-3 p-2 bg-black/70 backdrop-blur-md rounded-xl">
                <Mic className="w-4 h-4 text-white/80" />
              </div>
            </div>

            {/* Other Participants - Grid */}
            <div className="grid grid-cols-2 gap-2">
              {participants.filter(p => p.id !== activeSpeaker).map((participant) => (
                <div
                  key={participant.id}
                  className="relative aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-[#7c3aed]/50 transition-all"
                  onClick={() => setActiveSpeaker(participant.id)}
                >
                  {/* Avatar */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                      style={{
                        backgroundColor: `${participant.color}15`,
                        borderColor: participant.color,
                        color: participant.color,
                        fontWeight: '600'
                      }}
                    >
                      {participant.avatar}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="absolute bottom-2 left-2 text-xs text-white/90 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                    {participant.name}
                  </div>

                  {/* Speaking indicator */}
                  {participant.speaking && (
                    <div 
                      className="absolute inset-0 border-2 rounded-xl pointer-events-none animate-pulse"
                      style={{ borderColor: '#06b6d4' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Audio mode - Voice only */
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-white/10 transition-all"
              >
                {/* Avatar with pulse animation when speaking */}
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                    style={{
                      backgroundColor: `${participant.color}15`,
                      borderColor: participant.color,
                      color: participant.color,
                      boxShadow: participant.speaking ? `0 0 20px ${participant.color}80` : 'none',
                      fontWeight: '600'
                    }}
                  >
                    {participant.avatar}
                  </div>

                  {/* Speaking ring animation */}
                  {participant.speaking && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{
                        border: `2px solid ${participant.color}`,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>

                {/* Name and status */}
                <div className="flex-1">
                  <div className="text-sm text-white/90">{participant.name}</div>
                  <div className="text-xs text-white/50 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Active
                  </div>
                </div>

                {/* Mic status */}
                <div className="p-1.5 rounded-lg bg-white/5">
                  {isMuted && participant.id === 1 ? (
                    <MicOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-white/60" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center justify-center gap-2">
          {/* Mute button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-xl transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-[#1a1a1a] hover:bg-[#252525] text-white/80'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video button */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-3 rounded-xl transition-all ${
              isVideoOff
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-[#1a1a1a] hover:bg-[#252525] text-white/80'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen share button */}
          <button
            className="p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] transition-all text-white/80"
            title="Share screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Settings button */}
          <button
            className="p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] transition-all text-white/80"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* End call button */}
          <button
            className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-all text-red-400"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}