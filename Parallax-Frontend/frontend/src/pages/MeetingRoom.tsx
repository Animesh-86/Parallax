import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MonitorUp,
  Video,
  VideoOff,
  Hand,
  UserPlus,
  Mail,
  AtSign,
  Settings,
  LogOut,
  Users,
  Copy,
  Check,
  MessageCircle,
  Code2,
  PenTool,
  ScreenShare,
  ListTodo,
  Send,
  Minimize2,
  Maximize2,
  ChevronDown,
  GripVertical,
  LayoutGrid,
  Maximize,
  X,
  SmilePlus,
  Pin,
  Shield,
  ShieldCheck,
  MoreVertical,
  VolumeX as VolumeXIcon,
  Ban,
  Crown,
  Lock as LockIcon,
  MessageSquareOff,
  MonitorOff,
  FileText,
  MousePointer2,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import { CosmicStars } from "../components/workspace/CosmicStars";
import { useVoice } from '../context/VoiceContext';
import { collabApi, MeetingRoom as RoomData, RoomSettingsUpdatePayload } from '../services/collabApi';
import { voiceWs } from '../services/wsVoice';
import Whiteboard from '../components/workspace/Whiteboard';

// ─── TYPES ───────────────────────────────────────────────

type SidePanel = 'none' | 'chat' | 'code' | 'whiteboard' | 'tasks' | 'people' | 'notes';
type LayoutMode = 'grid' | 'spotlight' | 'sidebar';
type MeetingPhase = 'lobby' | 'meeting';

interface ChatMsg {
  id: number;
  senderId: string;
  displayName: string;
  message: string;
  time: string;
  color: string;
  avatar: string;
  isSystem?: boolean;
}

interface LocalTask {
  id: number;
  text: string;
  done: boolean;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

interface HandNotification {
  id: number;
  name: string;
}

// ─── CONSTANTS ───────────────────────────────────────────

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const REACTIONS = ['👏', '🎉', '😂', '❤️', '👍', '🔥', '😮', '🤔'];

function getColor(str: string) {
  const colors = ['#38BDF8', '#94A3B8', '#7DD3FC', '#F472B6', '#EF6461', '#4ADE80'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return colors[hash % colors.length];
}

function getDisplayName(): string {
  const token = localStorage.getItem("access_token");
  if (!token) return "You";
  try {
    const decoded: any = JSON.parse(atob(token.split('.')[1]));
    return decoded.displayName || decoded.fullName || decoded.username || decoded.sub?.substring(0, 6) || "You";
  } catch { return "You"; }
}

function getUserId(): string {
  const token = localStorage.getItem("access_token");
  if (!token) return '';
  try {
    const decoded: any = JSON.parse(atob(token.split('.')[1]));
    return decoded.userId || decoded.sub || '';
  } catch { return ''; }
}

// ─── VIDEO TILE COMPONENT ────────────────────────────────

function VideoTile({
  stream,
  label,
  isMuted: tileMuted,
  isSpeaking,
  isLocal,
  isSpotlight,
  speakerMuted,
  onPin,
  isPinned,
  hasHandRaised,
}: {
  stream: MediaStream | null;
  label: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
  isLocal?: boolean;
  isSpotlight?: boolean;
  speakerMuted?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
  hasHandRaised?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasVideo = !!stream?.getVideoTracks().some(t => t.enabled && t.readyState === 'live' && !t.muted);
  const color = getColor(label);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, hasVideo]);

  useEffect(() => {
    if (audioRef.current && stream && !isLocal) {
      audioRef.current.srcObject = stream;
      audioRef.current.muted = !!speakerMuted;
    }
  }, [stream, isLocal, speakerMuted]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 group ${
        isSpotlight ? 'col-span-full row-span-full' : ''
      } ${
        isSpeaking
          ? 'ring-2 ring-[#38BDF8] shadow-lg shadow-[#38BDF8]/20'
          : 'ring-1 ring-white/10'
      }`}
      style={{ backgroundColor: `${color}15` }}
    >
      {/* Remote audio */}
      {!isLocal && stream && <audio ref={audioRef} autoPlay />}

      {/* Video or Avatar */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? 'transform -scale-x-100' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl transition-transform group-hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${color}40, ${color}20)`,
              color,
              border: `1px solid ${color}30`
            }}
          >
            {label.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
            {[0, 150, 300].map((delay, i) => (
              <div
                key={i}
                className="w-1 bg-[#38BDF8] rounded-full animate-pulse"
                style={{ height: `${8 + (i % 2) * 6}px`, animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom label bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{label}</span>
            {isLocal && <span className="text-xs text-white/50">(You)</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {hasHandRaised && <span className="text-base animate-bounce">✋</span>}
            {tileMuted && <MicOff className="w-3.5 h-3.5 text-[#EF6461]" />}
          </div>
        </div>
      </div>

      {/* Pin button on hover */}
      {onPin && (
        <button
          onClick={onPin}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
            isPinned ? 'bg-[#38BDF8]/30 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'
          }`}
          title={isPinned ? 'Unpin' : 'Pin to spotlight'}
        >
          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-[#38BDF8]' : 'text-white'}`} />
        </button>
      )}
    </div>
  );
}

// ─── PRE-JOIN LOBBY COMPONENT ────────────────────────────

function PreJoinLobby({
  roomName,
  onJoin,
}: {
  roomName: string;
  onJoin: (videoOn: boolean, audioOn: boolean) => void;
}) {
  const [videoOn, setVideoOn] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const displayName = getDisplayName();

  // Get preview stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    const getStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoOn,
          audio: audioOn,
        });
        setPreviewStream(stream);
      } catch (e) {
        console.warn("Could not get preview media:", e);
      }
    };
    getStream();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [videoOn, audioOn]);

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  return (
    <div className="fixed inset-0 z-50 bg-[#060910] flex items-center justify-center">
      <CosmicStars />
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-[#38BDF8] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-[#94A3B8] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg w-full mx-4">
        {/* Room name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Ready to join?
          </h1>
          <p className="text-white/50 text-lg">{roomName || 'Meeting Room'}</p>
        </div>

        {/* Camera preview */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[#0C1220] border border-white/10 relative">
          {videoOn && previewStream?.getVideoTracks().length ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F472B6]/30 to-[#38BDF8]/30 flex items-center justify-center text-4xl font-bold text-white/80">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-white/50 text-sm">Camera is off</span>
            </div>
          )}

          {/* Name tag */}
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
            <span className="text-sm text-white/90">{displayName}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAudioOn(!audioOn)}
            className={`p-4 rounded-full transition-all duration-300 ${
              audioOn
                ? 'bg-white/10 hover:bg-white/15 border border-white/10'
                : 'bg-[#EF6461]/20 text-[#EF6461] border border-[#EF6461]/50'
            }`}
          >
            {audioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setVideoOn(!videoOn)}
            className={`p-4 rounded-full transition-all duration-300 ${
              videoOn
                ? 'bg-white/10 hover:bg-white/15 border border-white/10'
                : 'bg-[#EF6461]/20 text-[#EF6461] border border-[#EF6461]/50'
            }`}
          >
            {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
        </div>

        {/* Join button */}
        <button
          onClick={() => {
            // Stop preview stream before joining
            if (previewStream) previewStream.getTracks().forEach(t => t.stop());
            onJoin(videoOn, audioOn);
          }}
          className="px-10 py-4 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-[#38BDF8]/40 transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          <span className="relative z-10">Join Now</span>
        </button>
      </div>
    </div>
  );
}

// ─── MAIN MEETING ROOM COMPONENT ─────────────────────────

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();

  // --- COMPONENT STATE ---
  const [phase, setPhase] = useState<MeetingPhase>('lobby');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [lobbyVideoOn, setLobbyVideoOn] = useState(false);
  const [lobbyAudioOn, setLobbyAudioOn] = useState(true);

  // Layout & UI State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [activePanel, setActivePanel] = useState<SidePanel>('none');
  const [pinnedPeer, setPinnedPeer] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');

  // Meeting Features State
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [handNotifications, setHandNotifications] = useState<HandNotification[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  // Security Controls State
  const [isUpdatingRoomConfig, setIsUpdatingRoomConfig] = useState(false);

  // Device & Hardware State
  const [devices, setDevices] = useState<{ audioIn: MediaDeviceInfo[]; videoIn: MediaDeviceInfo[]; audioOut: MediaDeviceInfo[] }>({ audioIn: [], videoIn: [], audioOut: [] });
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  // Monaco & Tasks State
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [editorCode, setEditorCode] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatMessage, setChatMessage] = useState('');

  // Presence & Admin State
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [actionMenuPeerId, setActionMenuPeerId] = useState<string | null>(null);

  // --- REFS ---
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef(0);
  const taskIdRef = useRef(0);
  const reactionIdRef = useRef(0);
  const handNotifIdRef = useRef(0);
  const codeSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextCodeBroadcastRef = useRef(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- VOICE / WebRTC HOOK ---
  const {
    joinCall, leaveCall, toggleMute, toggleVideo, setIsMuted,
    isMuted: voiceMuted, isVideoEnabled, isConnected,
    activeSpeakers, localStream, remoteStreams, remoteScreenStreams, peerNames,
    changeAudioSource, changeVideoSource,
    beginScreenShare, endScreenShare, isLocalScreenSharing
  } = useVoice();

  // --- DERIVED STATE ---
  const currentUserId = useMemo(() => getUserId(), []);
  const isAdmin = useMemo(() => adminIds.has(currentUserId), [adminIds, currentUserId]);
  const isHost = useMemo(() => roomData?.createdBy === currentUserId, [roomData, currentUserId]);
  const canViewWhiteboard = useMemo(() => {
    if (!roomData) return false;
    return isHost || roomData.whiteboardVisibility === 'PUBLIC';
  }, [roomData, isHost]);
  const canEditWhiteboard = useMemo(() => {
    if (!roomData) return false;
    if (!canViewWhiteboard) return false;
    return isHost || roomData.whiteboardEditPolicy === 'EVERYONE';
  }, [roomData, isHost, canViewWhiteboard]);
  const canViewCode = useMemo(() => {
    if (!roomData) return false;
    return isHost || roomData.codeVisibility === 'PUBLIC';
  }, [roomData, isHost]);
  const canViewTasks = useMemo(() => {
    if (!roomData) return false;
    return isHost || roomData.taskVisibility === 'PUBLIC';
  }, [roomData, isHost]);

  // Derive chat and screen share disabled state from roomData
  const isChatDisabled = useMemo(() => roomData?.chatDisabled ?? false, [roomData]);
  const isScreenShareDisabled = useMemo(() => roomData?.screenShareDisabled ?? false, [roomData]);

  const participants = useMemo(() => {
    const all: { id: string; stream: MediaStream | null; label: string; isMuted: boolean; isLocal: boolean; isAdmin: boolean; hasHandRaised: boolean }[] = [];
    all.push({ 
        id: currentUserId || 'local', 
        stream: localStream, 
        label: getDisplayName(), 
        isMuted: voiceMuted, 
        isLocal: true, 
        isAdmin: adminIds.has(currentUserId), 
        hasHandRaised: isHandRaised 
    });
    remoteStreams.forEach((stream, peerId) => {
      const name = peerNames.get(peerId) || `User ${peerId.substring(0, 6)}`;
      all.push({ 
          id: peerId, 
          stream, 
          label: name, 
          isMuted: false, 
          isLocal: false, 
          isAdmin: adminIds.has(peerId), 
          hasHandRaised: raisedHands.has(peerId) 
      });
    });
    return all;
  }, [localStream, remoteStreams, voiceMuted, peerNames, adminIds, currentUserId, isHandRaised, raisedHands]);

  const gridCols = useMemo(() => {
    const n = participants.length;
    if (n <= 1) return 1;
    if (layoutMode === 'sidebar') return 1; // Main area is 1 col
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    return 4;
  }, [participants.length, layoutMode]);

  // Determine focused participant for Spotlight/Sidebar
  const focusedParticipant = useMemo(() => {
    if (isLocalScreenSharing) return participants.find(p => p.isLocal) || participants[0];
    const remoteSharingId = Array.from(remoteScreenStreams.keys())[0];
    if (remoteSharingId) return participants.find(p => p.id === remoteSharingId) || participants[0];

    if (pinnedPeer) return participants.find(p => p.id === pinnedPeer) || participants[0];
    if (activeSpeakers.length > 0) {
      const speakerId = activeSpeakers[0];
      return participants.find(p => p.id === speakerId) || participants[0];
    }
    return participants[0];
  }, [participants, pinnedPeer, activeSpeakers, isLocalScreenSharing, remoteScreenStreams]);

  const otherParticipants = useMemo(() => {
    return participants.filter(p => p.id !== focusedParticipant?.id);
  }, [participants, focusedParticipant]);

  // --- HANDLERS ---

  const handleInviteUser = async () => {
    if (!inviteInput.trim() || !roomData) return;
    setIsInviting(true);
    try {
      await collabApi.inviteToRoom(roomData.id, inviteInput.trim());
      setInviteStatus('✅ Invitation sent!');
      setInviteInput('');
    } catch (err: any) {
      setInviteStatus(`❌ ${err.response?.data?.error || 'User not found'}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleSetting = (type: 'chat' | 'screenShare') => {
    if (!isAdmin || !roomData) return;

    if (type === 'chat') {
      handleUpdateRoomConfig({ chatDisabled: !isChatDisabled }, `Chat is now ${!isChatDisabled ? 'disabled' : 'enabled'}`);
    } else {
      handleUpdateRoomConfig({ screenShareDisabled: !isScreenShareDisabled }, `Screen Share is now ${!isScreenShareDisabled ? 'disabled' : 'enabled'}`);
    }
  };

  const handleUpdateRoomConfig = useCallback(async (payload: RoomSettingsUpdatePayload, successMessage: string) => {
    if (!isAdmin || !roomData) return;
    try {
      setIsUpdatingRoomConfig(true);
      const updated = roomCode
        ? await collabApi.updateRoomSettingsByCode(roomCode, payload)
        : await collabApi.updateRoomSettings(roomData.id, payload);

      setRoomData(updated);
      toast.success(successMessage);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update room settings');
    } finally {
      setIsUpdatingRoomConfig(false);
    }
  }, [isAdmin, roomData, roomCode]);

  const handleToggleRoomConfig = useCallback((setting: 'codeOpen' | 'whiteboardEnabled', value: boolean) => {
    if (setting === 'codeOpen') {
      handleUpdateRoomConfig({ codeOpen: value }, `Room join-by-code is now ${value ? 'open' : 'invite-only'}`);
    } else {
      handleUpdateRoomConfig({ whiteboardEnabled: value }, `Whiteboard is now ${value ? 'enabled' : 'disabled'}`);
    }
  }, [handleUpdateRoomConfig]);

  const handleSetMode = useCallback((mode: 'INTERVIEW' | 'TEAM') => {
    handleUpdateRoomConfig(
      { collaborationMode: mode },
      mode === 'INTERVIEW' ? 'Interview mode enabled (restrictive defaults applied)' : 'Team mode enabled (customization unlocked)'
    );
  }, [handleUpdateRoomConfig]);

  const handleSendChat = useCallback(() => {
    if (!chatMessage.trim()) return;
    if (isChatDisabled && !isAdmin) return;
    const name = getDisplayName();
    voiceWs.publishChat({ message: chatMessage.trim(), displayName: name });
    setChatMessages(prev => [...prev, {
      id: ++chatIdRef.current, senderId: 'local', displayName: name,
      message: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#F472B6', avatar: name.substring(0, 2).toUpperCase(),
    }]);
    setChatMessage('');
  }, [chatMessage, isChatDisabled, isAdmin]);

  const handleRaiseHand = useCallback(() => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    const name = getDisplayName();
    voiceWs.publishChat({
      isHandRaise: true,
      raised: next,
      displayName: name,
      message: '',
    });
  }, [isHandRaised]);

  const handleReaction = useCallback((emoji: string) => {
    setShowReactionPicker(false);
    voiceWs.publishChat({ message: emoji, displayName: getDisplayName(), isReaction: true });
    const id = ++reactionIdRef.current;
    setFloatingReactions(prev => [...prev, { id, emoji, x: 30 + Math.random() * 40 }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
  }, []);

  const handleMuteAll = useCallback(() => {
    voiceWs.publishChat({
      isAdminAction: true,
      action: 'MUTE_ALL',
      displayName: getDisplayName(),
      message: `🔇 ${getDisplayName()} muted everyone`,
    });
    setChatMessages(prev => [...prev, {
      id: ++chatIdRef.current, senderId: 'system', displayName: 'System',
      message: `🔇 You muted everyone`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#94A3B8', avatar: '⚡', isSystem: true,
    }]);
  }, []);

  const handleKickPeer = useCallback((peerId: string, peerName: string) => {
    voiceWs.publishChat({
      isAdminAction: true,
      action: 'KICK',
      targetId: peerId,
      displayName: getDisplayName(),
      message: '',
    });
    setChatMessages(prev => [...prev, {
      id: ++chatIdRef.current, senderId: 'system', displayName: 'System',
      message: `❌ ${peerName} was removed from the meeting`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#94A3B8', avatar: '⚡', isSystem: true,
    }]);
    setActionMenuPeerId(null);
  }, []);

  const handlePromotePeer = useCallback((peerId: string, peerName: string) => {
    setAdminIds(prev => new Set([...prev, peerId]));
    voiceWs.publishChat({ isAdminAction: true, action: 'PROMOTE', targetId: peerId, displayName: getDisplayName(), message: '' });
    voiceWs.publishChat({ message: `🛡️ ${peerName} was promoted to admin`, displayName: 'System', isSystem: true });
    setActionMenuPeerId(null);
  }, []);

  const handleLobbyJoin = useCallback((videoOn: boolean, audioOn: boolean) => {
    if (!roomData) return;
    setLobbyVideoOn(videoOn);
    setLobbyAudioOn(audioOn);
    setPhase('meeting');
    // Ensure we tell the context about initial mute state
    setIsMuted(!audioOn);
    joinCall(roomData.id, "room", audioOn, videoOn).then(() => {
      // Internal state is now handled by VoiceContext and passed back via isConnected/localStream
    });
  }, [roomData, joinCall, setIsMuted]);

  const handleScreenShare = useCallback(async () => {
    if (isLocalScreenSharing) {
      await endScreenShare();
      screenStreamRef.current = null;
    } else {
      // 1. Security Check
      if (isScreenShareDisabled && !isAdmin) {
        toast.error("Screen sharing is currently disabled by admin");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: "always" } as any,
          audio: false 
        });
        screenStreamRef.current = stream;
        await beginScreenShare(stream);
        
        // Auto Spotlight on share
        setLayoutMode('spotlight');
        setPinnedPeer('local');
        
        // Signal screen share start
        voiceWs.sendSignal({
           type: "CALL_SCREEN_SHARE",
           senderId: currentUserId,
           payload: { isSharing: true }
        });
      } catch (err) { 
        console.error("Screen share error:", err); 
        if (err instanceof Error && err.name !== 'NotAllowedError') {
          toast.error("Failed to start screen share");
        }
      }
    }
  }, [isLocalScreenSharing, isScreenShareDisabled, isAdmin, beginScreenShare, endScreenShare, currentUserId]);

  const publishTasksIfShared = useCallback((nextTasks: LocalTask[]) => {
    if (!roomData || roomData.taskVisibility !== 'PUBLIC') return;
    voiceWs.publishChat({
      isTaskSync: true,
      tasks: nextTasks,
      displayName: getDisplayName(),
      message: ''
    });
  }, [roomData]);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const nextTasks = [...tasks, { id: ++taskIdRef.current, text: newTaskText.trim(), done: false }];
    setTasks(nextTasks);
    setNewTaskText('');
    publishTasksIfShared(nextTasks);
  };

  const toggleTask = (id: number) => {
    const nextTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(nextTasks);
    publishTasksIfShared(nextTasks);
  };

  const removeTask = (id: number) => {
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);
    publishTasksIfShared(nextTasks);
  };

  const togglePanel = (panel: SidePanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  const handleCopyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // --- EFFECTS ---

  useEffect(() => {
    if (roomCode) {
      collabApi.joinRoom(roomCode)
        .then((data) => {
          setRoomData(data);
          setAdminIds(new Set([data.createdBy]));
        })
        .catch(() => navigate('/dashboard'));
    }
  }, [roomCode, navigate]);

  useEffect(() => {
    if (!isConnected || !roomData || phase !== 'meeting') return;
    const timer = setTimeout(() => {
      voiceWs.subscribeChat((payload: any) => {
        // No longer manual syncing names here, VoiceContext handles it via CALL_JOIN/CALL_PRESENCE
        if (payload.isHandRaise) {
          const peerId = payload.senderId;
          if (peerId !== currentUserId) {
            if (payload.raised) {
              setRaisedHands(prev => new Set([...prev, peerId]));
              const nId = ++handNotifIdRef.current;
              setHandNotifications(prev => [...prev, { id: nId, name: payload.displayName || 'Someone' }]);
              setTimeout(() => setHandNotifications(prev => prev.filter(n => n.id !== nId)), 4000);
            } else {
              setRaisedHands(prev => { const n = new Set(prev); n.delete(peerId); return n; });
            }
          }
          return;
        }
        if (payload.isNotesUpdate && payload.senderId !== currentUserId) {
          setMeetingNotes(payload.notes);
        }
        if (payload.isCodeSync && payload.senderId !== currentUserId) {
          skipNextCodeBroadcastRef.current = true;
          setEditorCode(payload.code || '');
          return;
        }
        if (payload.isTaskSync && payload.senderId !== currentUserId) {
          if (Array.isArray(payload.tasks)) {
            setTasks(payload.tasks);
          }
          return;
        }
        if (payload.isAdminAction) {
          if (payload.action === 'UPDATE_SETTINGS') {
            if (payload.settingType === 'codeOpen') {
              setRoomData(prev => prev ? { ...prev, codeOpen: !!payload.settingValue } : prev);
            }
            if (payload.settingType === 'whiteboardEnabled') {
              setRoomData(prev => prev ? { ...prev, whiteboardEnabled: !!payload.settingValue } : prev);
            }
          }
          if (payload.action === 'KICK' && payload.targetId === currentUserId) {
            leaveCall(true); navigate('/dashboard'); return;
          }
          if (payload.action === 'PROMOTE') {
            setAdminIds(prev => new Set([...prev, payload.targetId]));
          }
          if (payload.action === 'MUTE_ALL' && payload.senderId !== currentUserId) {
             // Logic for auto-mute if wanted
          }
          return;
        }
        if (payload.isPresence) return;
        if (payload.isReaction) {
          const id = ++reactionIdRef.current;
          setFloatingReactions(prev => [...prev, { id, emoji: payload.message, x: 30 + Math.random() * 40 }]);
          setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
          return;
        }
        setChatMessages(prev => [...prev, {
          id: ++chatIdRef.current,
          senderId: payload.senderId || 'unknown',
          displayName: payload.displayName || 'User',
          message: payload.message || '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          color: payload.isSystem ? '#94A3B8' : getColor(payload.senderId || 'x'),
          avatar: payload.isSystem ? '⚡' : (payload.displayName || 'U').substring(0, 2).toUpperCase(),
          isSystem: payload.isSystem,
        }]);
      });
      voiceWs.publishChat({ displayName: getDisplayName(), message: '', isPresence: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [isConnected, roomData, leaveCall, navigate, currentUserId]);

  useEffect(() => {
    if (
      (activePanel === 'whiteboard' && !canViewWhiteboard) ||
      (activePanel === 'code' && !canViewCode) ||
      (activePanel === 'tasks' && !canViewTasks)
    ) {
      setActivePanel('none');
    }
  }, [activePanel, canViewWhiteboard, canViewCode, canViewTasks]);

  useEffect(() => {
    const newCount = remoteStreams.size;
    if (newCount > 0 && isConnected) {
      voiceWs.publishChat({ displayName: getDisplayName(), message: '', isPresence: true });
    }
  }, [remoteStreams.size, isConnected]);

  useEffect(() => {
    if (!isConnected || !roomData || phase !== 'meeting') return;
    if (roomData.codeVisibility !== 'PUBLIC') return;

    if (codeSyncDebounceRef.current) {
      clearTimeout(codeSyncDebounceRef.current);
    }

    codeSyncDebounceRef.current = setTimeout(() => {
      if (skipNextCodeBroadcastRef.current) {
        skipNextCodeBroadcastRef.current = false;
        return;
      }
      voiceWs.publishChat({
        isCodeSync: true,
        code: editorCode,
        displayName: getDisplayName(),
        message: ''
      });
    }, 250);

    return () => {
      if (codeSyncDebounceRef.current) {
        clearTimeout(codeSyncDebounceRef.current);
      }
    };
  }, [editorCode, isConnected, roomData, phase]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          audioIn: devs.filter(d => d.kind === 'audioinput'),
          videoIn: devs.filter(d => d.kind === 'videoinput'),
          audioOut: devs.filter(d => d.kind === 'audiooutput')
        });
      } catch (err) { console.error("Error listing devices:", err); }
    };
    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  // Synchronize selected devices with current track settings
  useEffect(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      const videoTrack = localStream.getVideoTracks()[0];
      if (audioTrack?.getSettings().deviceId) setSelectedMicrophone(audioTrack.getSettings().deviceId!);
      if (videoTrack?.getSettings().deviceId) setSelectedCamera(videoTrack.getSettings().deviceId!);
    }
  }, [localStream]);

  // Dynamic Screen Share Enforcement
  useEffect(() => {
    if (isScreenShareDisabled && !isAdmin && isLocalScreenSharing) {
      toast.info("Screen sharing was disabled by admin");
      endScreenShare();
    }
  }, [isScreenShareDisabled, isAdmin, isLocalScreenSharing, endScreenShare]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    if (screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [isLocalScreenSharing]);

  // Handle cleanup when screen sharing stops
  useEffect(() => {
    if (!isLocalScreenSharing) {
      screenStreamRef.current = null;
      if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      // If we were sharing and stopped, optionally return to grid
      // but let's keep it in spotlight for now if people want to focus on the next person.
      // Resetting layout is usually preferred though.
      setLayoutMode('grid');
    }
  }, [isLocalScreenSharing]);

  // Remote Screen Share Auto-Spotlight
  useEffect(() => {
    const sharingPeers = Array.from(remoteScreenStreams.keys());
    if (sharingPeers.length > 0) {
      setLayoutMode('spotlight');
      setPinnedPeer(sharingPeers[0]);
    } else if (!isLocalScreenSharing) {
      // Optionally return to grid when nobody is sharing
      // setLayoutMode('grid'); 
    }
  }, [remoteScreenStreams.size, isLocalScreenSharing]);

  const selectedLang = LANGUAGES.find(l => l.value === editorLanguage);
  const hasSidePanel = activePanel !== 'none';

  // ─── PRE-JOIN LOBBY ──────────────────────────────────

  if (phase === 'lobby') {
    return (
      <PreJoinLobby
        roomName={roomData?.name || ''}
        onJoin={handleLobbyJoin}
      />
    );
  }

  // ─── MAIN MEETING UI ─────────────────────────────────

  return (
    <div className="h-screen bg-[#060910] text-white overflow-hidden relative flex flex-col">
      <CosmicStars />
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-[#38BDF8] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-[#94A3B8] rounded-full blur-[150px]" />
      </div>

      {/* Floating reactions */}
      {floatingReactions.map(r => (
        <div
          key={r.id}
          className="fixed z-[100] text-4xl pointer-events-none animate-reaction-float"
          style={{ left: `${r.x}%`, bottom: '100px' }}
        >
          {r.emoji}
        </div>
      ))}

      {/* ─── SETTINGS MODAL ────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#060910]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0C1220] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#38BDF8]" />
                Device Settings
              </h2>
              <button 
                onClick={() => setShowSettings(false)} 
                className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* VIDEO */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" />
                  Camera
                </label>
                <select 
                  value={selectedCamera}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCamera(id);
                    changeVideoSource(id);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#38BDF8]/40 appearance-none cursor-pointer"
                >
                  {devices.videoIn.map(d => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-[#0C1220]">{d.label || 'Default Camera'}</option>
                  ))}
                  {devices.videoIn.length === 0 && <option disabled>No cameras found</option>}
                </select>
              </div>

              {/* AUDIO INPUT */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5" />
                  Microphone
                </label>
                <select 
                  value={selectedMicrophone}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedMicrophone(id);
                    changeAudioSource(id);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#38BDF8]/40 appearance-none cursor-pointer"
                >
                  {devices.audioIn.map(d => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-[#0C1220]">{d.label || 'Default Microphone'}</option>
                  ))}
                  {devices.audioIn.length === 0 && <option disabled>No microphones found</option>}
                </select>
              </div>

              {/* AUDIO OUTPUT */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  Speakers
                </label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none cursor-not-allowed opacity-50" disabled>
                   <option>System Default (Fixed in WebRTC)</option>
                </select>
              </div>

              {/* TEST INFO */}
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                 <p className="text-[10px] text-white/40 leading-relaxed">
                   Switching devices during a call requires browser permission. If you change devices, the stream will restart automatically.
                 </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-white/[0.03] flex justify-end">
               <button 
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 bg-gradient-to-r from-[#38BDF8] to-[#38BDF8]/80 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-[#38BDF8]/20 transition-all"
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Hand raise notifications */}
      <div className="fixed top-20 right-6 z-[100] space-y-2 pointer-events-none">
        {handNotifications.map(n => (
          <div
            key={n.id}
            className="flex items-center gap-3 px-4 py-3 bg-[#0C1220]/95 backdrop-blur-xl border border-[#FBBF24]/30 rounded-xl shadow-xl animate-slide-in pointer-events-auto"
          >
            <span className="text-xl animate-bounce">✋</span>
            <div>
              <div className="text-sm font-medium text-white">{n.name}</div>
              <div className="text-[10px] text-white/40">raised their hand</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── HEADER ──────────────────────────────────── */}
      <div className="bg-[#060910]/95 backdrop-blur-md border-b border-white/5 px-6 py-3 flex-shrink-0 relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-white/90">{roomData?.name || 'Meeting Room'}</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyRoomCode}
                  className="flex items-center gap-2 px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group"
                >
                  <span className="text-xs font-mono text-white/40">{roomCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Copy className="w-3 h-3 text-white/40" />}
                </button>
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <Users className="w-3.5 h-3.5" />
                  <span>{participants.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { leaveCall(true); navigate('/dashboard'); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#EF6461]/90 rounded-xl hover:bg-[#EF6461] transition-all text-white font-medium shadow-lg shadow-[#EF6461]/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Leave Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ────────────────────────────── */}
      <div ref={containerRef} className="flex flex-1 min-h-0 relative z-10 overflow-hidden">
        {/* VIDEO / CONTENT AREA */}
        <div className="flex-1 min-w-0 p-3 flex gap-4 overflow-hidden">
          {/* PRIMARY VIEW (MAIN AREA) */}
          <div className="flex-1 min-w-0 flex flex-col relative">
            {isLocalScreenSharing ? (
              /* Screen share spotlight */
              <div className="flex-1 rounded-2xl overflow-hidden bg-black relative border border-white/10">
                <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-[#EF6461]/90 rounded-lg text-sm flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="font-medium">You are presenting</span>
                </div>
              </div>
            ) : layoutMode === 'grid' ? (
              /* GRID LAYOUT */
              <div 
                className="flex-1 grid gap-3 min-h-0"
                style={{ 
                  gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                  gridAutoRows: '1fr'
                }}
              >
                {participants.map(p => (
                  <VideoTile
                    key={p.id}
                    stream={p.stream}
                    label={p.label}
                    isMuted={p.isMuted}
                    isSpeaking={activeSpeakers.includes(p.id === 'local' ? currentUserId : p.id)}
                    isLocal={p.isLocal}
                    speakerMuted={!isSpeakerOn && !p.isLocal}
                    onPin={() => setPinnedPeer(prev => prev === p.id ? null : p.id)}
                    isPinned={pinnedPeer === p.id}
                    hasHandRaised={p.hasHandRaised}
                  />
                ))}
              </div>
            ) : (
              /* SPOTLIGHT or SIDEBAR MAIN VIEW */
              <div className="flex-1 min-h-0">
                {focusedParticipant ? (
                  <VideoTile
                    stream={focusedParticipant.stream}
                    label={focusedParticipant.label}
                    isMuted={focusedParticipant.isMuted}
                    isSpeaking={activeSpeakers.includes(focusedParticipant.id === 'local' ? currentUserId : focusedParticipant.id)}
                    isLocal={focusedParticipant.isLocal}
                    isSpotlight={true}
                    speakerMuted={!isSpeakerOn && !focusedParticipant.isLocal}
                    onPin={() => setPinnedPeer(prev => prev === focusedParticipant.id ? null : focusedParticipant.id)}
                    isPinned={pinnedPeer === focusedParticipant.id}
                    hasHandRaised={focusedParticipant.hasHandRaised}
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                    <span className="text-white/20">Waiting for participants...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR VIEW (For Sidebar Layout) */}
          {layoutMode === 'sidebar' && otherParticipants.length > 0 && (
            <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
              {otherParticipants.map(p => (
                <div key={p.id} className="aspect-video w-full flex-shrink-0">
                  <VideoTile
                    stream={p.stream}
                    label={p.label}
                    isMuted={p.isMuted}
                    isSpeaking={activeSpeakers.includes(p.id === 'local' ? currentUserId : p.id)}
                    isLocal={p.isLocal}
                    speakerMuted={!isSpeakerOn && !p.isLocal}
                    onPin={() => setPinnedPeer(prev => prev === p.id ? null : p.id)}
                    isPinned={pinnedPeer === p.id}
                    hasHandRaised={p.hasHandRaised}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RESIZE HANDLE */}
        {hasSidePanel && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1.5 flex-shrink-0 bg-white/5 hover:bg-[#38BDF8]/30 active:bg-[#38BDF8]/50 cursor-col-resize transition-colors flex items-center justify-center group z-20"
          >
            <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/60" />
          </div>
        )}

        {/* SIDEBAR PANEL (Chat, Notes, etc.) */}
        {hasSidePanel && (
          <div className="flex flex-col bg-[#060910] border-l border-white/5 min-w-0" style={{ width: `${sidebarWidth}%` }}>
            {/* Panel header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 flex-shrink-0">
              <h3 className="text-sm font-semibold text-white/80 capitalize flex items-center gap-2">
                {activePanel === 'chat' && <><MessageCircle className="w-4 h-4" /> Chat</>}
                {activePanel === 'code' && <><Code2 className="w-4 h-4" /> Code</>}
                {activePanel === 'whiteboard' && <><PenTool className="w-4 h-4" /> Whiteboard</>}
                {activePanel === 'tasks' && <><ListTodo className="w-4 h-4" /> Tasks</>}
                {activePanel === 'people' && <><Users className="w-4 h-4" /> People</>}
                {activePanel === 'notes' && <><FileText className="w-4 h-4" /> Notes</>}
              </h3>
              <button onClick={() => setActivePanel('none')} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* CHAT PANEL */}
              {activePanel === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-white/20 text-sm py-8">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No messages yet
                      </div>
                    )}
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={msg.isSystem ? 'text-center' : ''}>
                        {msg.isSystem ? (
                          <span className="text-xs text-white/40">{msg.message}</span>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: `${msg.color}30`, color: msg.color }}>{msg.avatar}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-1.5"><span className="text-xs font-medium truncate">{msg.displayName}</span><span className="text-[10px] text-white/30">{msg.time}</span></div>
                              <p className="text-sm text-white/80 break-words">{msg.message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-white/5 flex-shrink-0 flex items-center gap-2">
                    <input 
                      type="text" 
                      value={chatMessage} 
                      onChange={e => setChatMessage(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }} 
                      placeholder={isChatDisabled && !isAdmin ? "Chat is disabled by admin" : "Send a message..."}
                      disabled={isChatDisabled && !isAdmin}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38BDF8]/50 placeholder:text-white/30 min-w-0" 
                    />
                    <button 
                      onClick={handleSendChat} 
                      disabled={!chatMessage.trim() || (isChatDisabled && !isAdmin)} 
                      className="p-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg disabled:opacity-40 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* NOTES PANEL */}
              {activePanel === 'notes' && (
                <div className="flex-1 flex flex-col p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      Shared Meeting Notes
                    </label>
                  </div>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMeetingNotes(val);
                      voiceWs.publishChat({
                        isNotesUpdate: true,
                        notes: val,
                        displayName: getDisplayName(),
                        message: ''
                      });
                    }}
                    placeholder="Capture key points, actions, and decisions..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 focus:outline-none focus:border-[#38BDF8]/30 resize-none placeholder:text-white/20 leading-relaxed"
                  />
                </div>
              )}

              {/* CODE PANEL */}
              {activePanel === 'code' && (
                canViewCode ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 flex-shrink-0">
                    <div className="relative">
                      <button onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/80 hover:bg-white/[0.07]">
                        <span>{selectedLang?.label || 'Language'}</span>
                        <ChevronDown className={`w-3 h-3 text-white/40 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isLangDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-36 bg-[#0C1220]/95 border border-white/10 rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-auto">
                          {LANGUAGES.map(l => (<button key={l.value} onClick={() => { setEditorLanguage(l.value); setIsLangDropdownOpen(false); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-white/5 ${editorLanguage === l.value ? 'text-[#38BDF8]' : 'text-white/80'}`}>{l.label}</button>))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1"><Editor height="100%" language={editorLanguage} value={editorCode} onChange={v => setEditorCode(v || '')} theme="vs-dark" options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 8 }, lineNumbers: 'on', wordWrap: 'on', tabSize: 2, automaticLayout: true }} /></div>
                </div>
                ) : (
                  <div className="flex-1 bg-[#060910] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                    Code panel is private in this room mode.
                  </div>
                )
              )}

              {/* WHITEBOARD PANEL */}
              {activePanel === 'whiteboard' && (
                roomData?.whiteboardEnabled ? (
                  canViewWhiteboard ? (
                    <div className="flex-1 bg-white relative"><Whiteboard canEdit={canEditWhiteboard} /></div>
                  ) : (
                    <div className="flex-1 bg-[#060910] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                      Whiteboard is private in this room mode.
                    </div>
                  )
                ) : (
                  <div className="flex-1 bg-[#060910] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                    Whiteboard is disabled by room host.
                  </div>
                )
              )}

              {/* TASKS PANEL */}
              {activePanel === 'tasks' && (
                canViewTasks ? (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }} placeholder="Add a task..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38BDF8]/50 placeholder:text-white/30 min-w-0" />
                    <button onClick={handleAddTask} disabled={!newTaskText.trim()} className="px-3 py-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg text-xs disabled:opacity-40">Add</button>
                  </div>
                  {tasks.length === 0 && <div className="text-center text-white/20 text-sm py-6"><ListTodo className="w-8 h-8 mx-auto mb-2 opacity-30" />No tasks</div>}
                  {tasks.map(t => (<div key={t.id} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg mb-1.5 group"><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-3.5 h-3.5 accent-[#38BDF8]" /><span className={`text-sm flex-1 ${t.done ? 'line-through text-white/30' : ''}`}>{t.text}</span><button onClick={() => removeTask(t.id)} className="text-white/20 hover:text-[#EF6461] opacity-0 group-hover:opacity-100 text-xs">✕</button></div>))}
                </div>
                ) : (
                  <div className="flex-1 bg-[#060910] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                    Tasks panel is private in this room mode.
                  </div>
                )
              )}

              {/* PEOPLE PANEL */}
              {activePanel === 'people' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {/* Invite by email */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Invite via email
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={inviteInput}
                        onChange={e => { setInviteInput(e.target.value); setInviteStatus(null); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && inviteInput.trim()) {
                            handleInviteUser();
                          }
                        }}
                        placeholder="colleague@email.com"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38BDF8]/50 placeholder:text-white/30 min-w-0"
                      />
                      <button
                        onClick={handleInviteUser}
                        disabled={!inviteInput.trim() || isInviting}
                        className="p-2 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-lg disabled:opacity-40 flex-shrink-0"
                      >
                        {isInviting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                    {inviteStatus && (
                      <p className="text-xs text-white/60">{inviteStatus}</p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] text-white/30 uppercase">or share link</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Invite link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Meeting link</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-white/50 truncate">
                        {window.location.origin}/room/{roomCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
                          setInviteCopied(true);
                          setTimeout(() => setInviteCopied(false), 2000);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 ${
                          inviteCopied ? 'bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30' : 'bg-[#38BDF8] text-white hover:bg-[#38BDF8]/90'
                        }`}
                      >
                        {inviteCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                  </div>

                  {/* Room code */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-[#38BDF8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/40 uppercase tracking-wide">Room Code</div>
                      <div className="text-sm font-mono font-semibold text-white">{roomCode}</div>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(roomCode || ''); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000); }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] text-white/30 uppercase">{participants.length} in meeting</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMuteAll}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#EF6461]/15 border border-[#EF6461]/30 rounded-xl text-xs font-medium text-[#EF6461] hover:bg-[#EF6461]/25 transition-all"
                      >
                        <VolumeXIcon className="w-3.5 h-3.5" />
                        Mute All
                      </button>
                    </div>
                  )}

                  {/* Security Settings (Admins only) */}
                  {isAdmin && (
                    <div className="space-y-2 pb-2">
                       <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-1">Room Security</label>
                       
                       {/* Mode Selection */}
                       <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSetMode('INTERVIEW')}
                            disabled={isUpdatingRoomConfig}
                            className={`flex items-center justify-center px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${roomData?.collaborationMode === 'INTERVIEW' ? 'bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                            <span className="text-xs font-medium">Interview</span>
                          </button>
                          <button
                            onClick={() => handleSetMode('TEAM')}
                            disabled={isUpdatingRoomConfig}
                            className={`flex items-center justify-center px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${roomData?.collaborationMode === 'TEAM' ? 'bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                            <span className="text-xs font-medium">Team</span>
                          </button>
                       </div>

                       {/* Mode Indicator Badge */}
                       <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${roomData?.collaborationMode === 'INTERVIEW' ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#A78BFA]' : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#6EE7B7]'}`}>
                         {roomData?.collaborationMode === 'INTERVIEW' ? (
                           <span>🔒 Restrictive: Chat & Screen Share disabled</span>
                         ) : (
                           <span>🎯 Flexible: All tools customizable</span>
                         )}
                       </div>

                       <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleToggleRoomConfig('codeOpen', !(roomData?.codeOpen ?? false))}
                            disabled={isUpdatingRoomConfig || roomData?.collaborationMode === 'INTERVIEW'}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${roomData?.codeOpen ? 'bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                             <div className="flex items-center gap-2 text-xs">
                               <LockIcon className="w-3.5 h-3.5" />
                               Open Join
                             </div>
                             <div className={`w-8 h-4 rounded-full relative transition-colors ${roomData?.codeOpen ? 'bg-[#FBBF24]' : 'bg-white/20'}`}>
                               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${roomData?.codeOpen ? 'right-0.5' : 'left-0.5'}`} />
                             </div>
                          </button>

                          <button 
                            onClick={() => handleToggleRoomConfig('whiteboardEnabled', !(roomData?.whiteboardEnabled ?? true))}
                            disabled={isUpdatingRoomConfig || roomData?.collaborationMode === 'INTERVIEW'}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${roomData?.whiteboardEnabled ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                             <div className="flex items-center gap-2 text-xs">
                               <PenTool className="w-3.5 h-3.5" />
                               Whiteboard
                             </div>
                             <div className={`w-8 h-4 rounded-full relative transition-colors ${roomData?.whiteboardEnabled ? 'bg-[#4ADE80]' : 'bg-white/20'}`}>
                               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${roomData?.whiteboardEnabled ? 'right-0.5' : 'left-0.5'}`} />
                             </div>
                          </button>
                          
                          <button 
                            onClick={() => handleToggleSetting('chat')}
                            disabled={isUpdatingRoomConfig || roomData?.collaborationMode === 'INTERVIEW'}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${!isChatDisabled ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                             <div className="flex items-center gap-2 text-xs">
                               <MessageSquareOff className="w-3.5 h-3.5" />
                               Chat
                             </div>
                             <div className={`w-8 h-4 rounded-full relative transition-colors ${!isChatDisabled ? 'bg-[#4ADE80]' : 'bg-white/20'}`}>
                               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${!isChatDisabled ? 'right-0.5' : 'left-0.5'}`} />
                             </div>
                          </button>

                          <button 
                            onClick={() => handleToggleSetting('screenShare')}
                            disabled={isUpdatingRoomConfig || roomData?.collaborationMode === 'INTERVIEW'}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${!isScreenShareDisabled ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                             <div className="flex items-center gap-2 text-xs">
                               <MonitorOff className="w-3.5 h-3.5" />
                               Screen Share
                             </div>
                             <div className={`w-8 h-4 rounded-full relative transition-colors ${!isScreenShareDisabled ? 'bg-[#4ADE80]' : 'bg-white/20'}`}>
                               <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${!isScreenShareDisabled ? 'right-0.5' : 'left-0.5'}`} />
                             </div>
                          </button>
                       </div>

                       {roomData?.collaborationMode === 'TEAM' && (
                         <div className="grid grid-cols-2 gap-2 pt-1">
                           <button
                             onClick={() => handleUpdateRoomConfig({ whiteboardVisibility: roomData?.whiteboardVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' }, `Whiteboard visibility set to ${roomData?.whiteboardVisibility === 'PUBLIC' ? 'private' : 'public'}`)}
                             disabled={isUpdatingRoomConfig}
                             className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-60"
                           >
                             <span className="text-xs">Whiteboard {roomData?.whiteboardVisibility === 'PUBLIC' ? 'Public' : 'Private'}</span>
                             <MousePointer2 className="w-3.5 h-3.5" />
                           </button>
                           <button
                             onClick={() => handleUpdateRoomConfig({ whiteboardEditPolicy: roomData?.whiteboardEditPolicy === 'EVERYONE' ? 'HOST_ONLY' : 'EVERYONE' }, `Whiteboard edit set to ${roomData?.whiteboardEditPolicy === 'EVERYONE' ? 'host only' : 'everyone'}`)}
                             disabled={isUpdatingRoomConfig}
                             className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-60"
                           >
                             <span className="text-xs">WB Edit {roomData?.whiteboardEditPolicy === 'EVERYONE' ? 'All' : 'Host'}</span>
                             <Shield className="w-3.5 h-3.5" />
                           </button>
                           <button
                             onClick={() => handleUpdateRoomConfig({ codeVisibility: roomData?.codeVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' }, `Code panel set to ${roomData?.codeVisibility === 'PUBLIC' ? 'private' : 'public'}`)}
                             disabled={isUpdatingRoomConfig}
                             className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-60"
                           >
                             <span className="text-xs">Code {roomData?.codeVisibility === 'PUBLIC' ? 'Public' : 'Private'}</span>
                             <Code2 className="w-3.5 h-3.5" />
                           </button>
                           <button
                             onClick={() => handleUpdateRoomConfig({ taskVisibility: roomData?.taskVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' }, `Tasks panel set to ${roomData?.taskVisibility === 'PUBLIC' ? 'private' : 'public'}`)}
                             disabled={isUpdatingRoomConfig}
                             className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-60"
                           >
                             <span className="text-xs">Tasks {roomData?.taskVisibility === 'PUBLIC' ? 'Public' : 'Private'}</span>
                             <ListTodo className="w-3.5 h-3.5" />
                           </button>
                         </div>
                       )}

                       {roomData?.collaborationMode === 'INTERVIEW' && (
                         <p className="text-[11px] text-white/40 px-1">
                           🔒 Restrictive: Invite-only join • Whiteboard shared (host-only edit) • Code & Tasks shared (view-only) • Chat & Screen Share disabled.
                         </p>
                       )}
                    </div>
                  )}

                  {/* Participant list */}
                  <div className="space-y-1">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group relative">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 relative"
                          style={{ backgroundColor: `${getColor(p.label)}25`, color: getColor(p.label) }}
                        >
                          {p.label.substring(0, 2).toUpperCase()}
                          {p.isAdmin && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FBBF24] rounded-full flex items-center justify-center">
                              <Crown className="w-2 h-2 text-black" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white/90 truncate">{p.label}</span>
                            {p.isAdmin && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#FBBF24]/20 text-[#FBBF24] rounded-md font-semibold">
                                {roomData?.createdBy === p.id ? 'HOST' : 'ADMIN'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/40">{p.isLocal ? 'You' : 'Connected'}</div>
                        </div>
                        {p.hasHandRaised && <span className="text-sm animate-bounce">✋</span>}
                        {p.isMuted && <MicOff className="w-3.5 h-3.5 text-[#EF6461]/70" />}

                        {/* Admin action menu trigger */}
                        {isAdmin && !p.isLocal && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenuPeerId(actionMenuPeerId === p.id ? null : p.id); }}
                            className="p-1 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-white/40" />
                          </button>
                        )}

                        {/* Context menu */}
                        {actionMenuPeerId === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-[#0C1220]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                            {!p.isAdmin && (
                              <button
                                onClick={() => handlePromotePeer(p.id, p.label)}
                                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 text-white/80"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-[#FBBF24]" />
                                Make Admin
                              </button>
                            )}
                            <button
                              onClick={() => handleKickPeer(p.id, p.label)}
                              className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#EF6461]/10 text-[#EF6461]"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Remove from meeting
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM CONTROL BAR ──────────────────────── */}
      <div className="bg-[#060910]/95 backdrop-blur-md border-t border-white/5 px-6 py-3 flex-shrink-0 relative z-20">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Left: time */}
          <div className="text-sm text-white/40 w-32">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Center: main controls */}
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className={`p-3 rounded-full transition-all ${voiceMuted ? 'bg-[#EF6461] text-white' : 'bg-white/10 hover:bg-white/15'}`} title={voiceMuted ? 'Unmute' : 'Mute'}>
              {voiceMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button onClick={toggleVideo} className={`p-3 rounded-full transition-all ${!isVideoEnabled ? 'bg-[#EF6461] text-white' : 'bg-white/10 hover:bg-white/15'}`} title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`p-3 rounded-full transition-all ${!isSpeakerOn ? 'bg-[#EF6461] text-white' : 'bg-white/10 hover:bg-white/15'}`} title={isSpeakerOn ? 'Deafen' : 'Undeafen'}>
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* Layout Selector */}
            <div className="flex items-center bg-white/5 rounded-2xl p-1 gap-1">
              <button 
                onClick={() => setLayoutMode('grid')} 
                className={`p-2 rounded-xl transition-all ${layoutMode === 'grid' ? 'bg-[#38BDF8] text-white' : 'text-white/40 hover:bg-white/10'}`}
                title="Grid Layout"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setLayoutMode('spotlight')} 
                className={`p-2 rounded-xl transition-all ${layoutMode === 'spotlight' ? 'bg-[#38BDF8] text-white' : 'text-white/40 hover:bg-white/10'}`}
                title="Spotlight Layout"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setLayoutMode('sidebar')} 
                className={`p-2 rounded-xl transition-all ${layoutMode === 'sidebar' ? 'bg-[#38BDF8] text-white' : 'text-white/40 hover:bg-white/10'}`}
                title="Sidebar Layout"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            <div className="w-px h-8 bg-white/10 mx-1" />

            <button 
              onClick={handleScreenShare} 
              className={`p-3 rounded-xl transition-all ${isLocalScreenSharing ? 'bg-[#38BDF8] text-white shadow-lg shadow-[#38BDF8]/20' : 'bg-white/5 text-white/70 hover:bg-white/10'} ${(isScreenShareDisabled && !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isScreenShareDisabled && !isAdmin ? "Disabled by admin" : (isLocalScreenSharing ? "Stop sharing" : "Share screen")}
            >
              {isLocalScreenSharing ? <MonitorUp className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
            </button>

            <button onClick={handleRaiseHand} className={`p-3 rounded-full transition-all ${isHandRaised ? 'bg-[#FBBF24] text-black' : 'bg-white/10 hover:bg-white/15'}`} title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
              <Hand className="w-5 h-5" />
            </button>

            {/* Reactions */}
            <div className="relative">
              <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="p-3 rounded-full bg-white/10 hover:bg-white/15 transition-all" title="Send a reaction">
                <SmilePlus className="w-5 h-5" />
              </button>
              {showReactionPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0C1220]/95 border border-white/10 rounded-2xl shadow-2xl p-2 flex gap-1">
                  {REACTIONS.map(emoji => (
                    <button key={emoji} onClick={() => handleReaction(emoji)} className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center text-xl hover:scale-125">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: side panel toggles */}
          <div className="flex items-center gap-1 w-40 justify-end">
            <button onClick={() => togglePanel('people')} className={`p-2 rounded-lg transition-all ${activePanel === 'people' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'hover:bg-white/10 text-white/60'}`} title="People">
              <UserPlus className="w-5 h-5" />
            </button>
            <button onClick={() => togglePanel('chat')} className={`p-2 rounded-lg transition-all relative ${activePanel === 'chat' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'hover:bg-white/10 text-white/60'}`} title="Chat">
              <MessageCircle className="w-5 h-5" />
              {chatMessages.length > 0 && activePanel !== 'chat' && <div className="absolute top-1 right-1 w-2 h-2 bg-[#38BDF8] rounded-full" />}
            </button>
            <button onClick={() => canViewCode && togglePanel('code')} className={`p-2 rounded-lg transition-all ${!canViewCode ? 'opacity-50 cursor-not-allowed text-white/30' : (activePanel === 'code' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'hover:bg-white/10 text-white/60')}`} title={canViewCode ? 'Code' : 'Code is private'}>
              <Code2 className="w-5 h-5" />
            </button>
            <button onClick={() => roomData?.whiteboardEnabled && canViewWhiteboard && togglePanel('whiteboard')} className={`p-2 rounded-lg transition-all ${(roomData?.whiteboardEnabled === false || !canViewWhiteboard) ? 'opacity-50 cursor-not-allowed text-white/30' : (activePanel === 'whiteboard' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'hover:bg-white/10 text-white/60')}`} title={roomData?.whiteboardEnabled === false ? "Whiteboard disabled by host" : (canViewWhiteboard ? "Whiteboard" : "Whiteboard is private")}>
              <PenTool className="w-5 h-5" />
            </button>
            <button onClick={() => canViewTasks && togglePanel('tasks')} className={`p-2 rounded-lg transition-all ${!canViewTasks ? 'opacity-50 cursor-not-allowed text-white/30' : (activePanel === 'tasks' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'hover:bg-white/10 text-white/60')}`} title={canViewTasks ? 'Tasks' : 'Tasks are private'}>
              <ListTodo className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reaction float animation style */}
      <style>{`
        @keyframes reaction-float {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          70% { opacity: 1; transform: translateY(-200px) scale(1.3); }
          100% { opacity: 0; transform: translateY(-300px) scale(0.8); }
        }
        .animate-reaction-float {
          animation: reaction-float 3s ease-out forwards;
        }
        @keyframes slide-in {
          0% { opacity: 0; transform: translateX(80px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
