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
  ChevronDown,
  GripVertical,
  LayoutGrid,
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
import { StompSubscription } from '@stomp/stompjs';

// ─── TYPES ───────────────────────────────────────────────

type SidePanel = 'none' | 'chat' | 'code' | 'whiteboard' | 'tasks' | 'people' | 'notes' | 'controls';
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
  const colors = ['#D4AF37', '#A1A1AA', '#F59E0B', '#D4AF37', '#EF6461', '#4ADE80'];
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
  forceVideoOff,
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
  forceVideoOff?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasVideo = !forceVideoOff && !!stream?.getVideoTracks().some(t => t.enabled && t.readyState === 'live' && !t.muted);
  const color = getColor(label);

  useEffect(() => {
    if (!videoRef.current) return;
    if (hasVideo && stream) {
      videoRef.current.srcObject = stream;
      return;
    }

    // Important for Chrome: detach the stream when video is off,
    // otherwise the last rendered frame can remain visible.
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
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
          ? 'ring-2 ring-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
          : 'ring-1 ring-white/10'
      } w-full h-full`}
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
                className="w-1 bg-[#D4AF37] rounded-full animate-pulse"
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
            isPinned ? 'bg-[#D4AF37]/30 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'
          }`}
          title={isPinned ? 'Unpin' : 'Pin to spotlight'}
        >
          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-[#D4AF37]' : 'text-white'}`} />
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
    <div className="fixed inset-0 z-50 bg-[#09090B] flex items-center justify-center">
      <CosmicStars />
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-[#A1A1AA] rounded-full blur-[150px]" />
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
        <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[#0D0D0F] border border-white/10 relative">
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
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/30 flex items-center justify-center text-4xl font-bold text-white/80">
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
          className="px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all relative overflow-hidden group"
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
  const [isMuteAllActive, setIsMuteAllActive] = useState(false);
  const [isForceMutedByHost, setIsForceMutedByHost] = useState(false);
  
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
  const lastIncomingChatRef = useRef<{ key: string; at: number } | null>(null);
  const taskIdRef = useRef(0);
  const reactionIdRef = useRef(0);
  const handNotifIdRef = useRef(0);
  const codeSyncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextCodeBroadcastRef = useRef(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatSubscriptionRef = useRef<StompSubscription | null>(null);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- VOICE / WebRTC HOOK ---
  const {
    joinCall, leaveCall, toggleMute, toggleVideo, setIsMuted,
    isMuted: voiceMuted, isVideoEnabled, isConnected,
    activeSpeakers, localStream, remoteStreams, remoteScreenStreams, peerNames,
    peerVideoEnabled,
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
    if (isHost) return true;
    if (roomData.whiteboardEditPolicy === 'EVERYONE') return true;
    return (roomData.whiteboardEditorUserIds || []).includes(currentUserId);
  }, [roomData, isHost, canViewWhiteboard]);
  const canViewCode = useMemo(() => {
    if (!roomData) return false;
    return isHost || roomData.codeVisibility === 'PUBLIC';
  }, [roomData, isHost]);
  const canEditCode = useMemo(() => {
    if (!roomData) return false;
    if (!canViewCode) return false;
    if (isHost) return true;
    return (roomData.codeEditorUserIds || []).includes(currentUserId);
  }, [roomData, canViewCode, isHost, currentUserId]);
  const canViewTasks = useMemo(() => {
    if (!roomData) return false;
    return isHost || roomData.taskVisibility === 'PUBLIC';
  }, [roomData, isHost]);
  const canMutateTasks = useMemo(() => {
    if (!roomData) return false;
    if (isHost) return true;
    if (roomData.collaborationMode === 'INTERVIEW') return false;
    if (roomData.taskVisibility === 'PRIVATE') return false;
    return roomData.taskEditPolicy === 'EVERYONE';
  }, [roomData, isHost]);
  const isInterviewMode = useMemo(() => roomData?.collaborationMode === 'INTERVIEW', [roomData]);
  const canInviteMembers = useMemo(() => {
    if (!roomData) return false;
    if (roomData.collaborationMode === 'INTERVIEW') return isHost;
    return true;
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
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    return 4;
  }, [participants.length]);

  const localParticipant = useMemo(() => {
    return participants.find(p => p.isLocal) || null;
  }, [participants]);

  const remoteParticipants = useMemo(() => {
    return participants.filter(p => !p.isLocal);
  }, [participants]);

  const participantTileMinHeight = useMemo(() => {
    const n = participants.length;
    if (n >= 8) return 96;
    if (n >= 5) return 112;
    if (n >= 3) return 128;
    return 150;
  }, [participants.length]);

  const renderParticipantTile = useCallback((p: typeof participants[number], compact: boolean = false) => (
    <div className={compact ? 'w-full aspect-video' : 'w-full h-full min-h-0'} style={compact ? { minHeight: Math.max(84, participantTileMinHeight - 24) } : undefined}>
      <VideoTile
        stream={p.stream}
        label={p.label}
        forceVideoOff={!p.isLocal ? peerVideoEnabled.get(p.id) !== true : !isVideoEnabled}
        isMuted={p.isMuted}
        isSpeaking={activeSpeakers.includes(p.id === 'local' ? currentUserId : p.id)}
        isLocal={p.isLocal}
        speakerMuted={!isSpeakerOn && !p.isLocal}
        onPin={() => setPinnedPeer(prev => prev === p.id ? null : p.id)}
        isPinned={pinnedPeer === p.id}
        hasHandRaised={p.hasHandRaised}
      />
    </div>
  ), [activeSpeakers, currentUserId, isSpeakerOn, peerVideoEnabled, pinnedPeer, participantTileMinHeight, isVideoEnabled]);

  const isWorkspacePanel = activePanel === 'code' || activePanel === 'whiteboard';

  // --- HANDLERS ---

  const handleInviteUser = async () => {
    if (!inviteInput.trim() || !roomData) return;
    if (!canInviteMembers) {
      setInviteStatus('Only the host can invite participants in interview mode.');
      return;
    }
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
      handleUpdateRoomConfig(
        { chatDisabled: !isChatDisabled },
        (updated) => `Chat is now ${updated.chatDisabled ? 'disabled' : 'enabled'}`
      );
    } else {
      handleUpdateRoomConfig(
        { screenShareDisabled: !isScreenShareDisabled },
        (updated) => `Screen Share is now ${updated.screenShareDisabled ? 'disabled' : 'enabled'}`
      );
    }
  };

  const handleUpdateRoomConfig = useCallback(async (
    payload: RoomSettingsUpdatePayload,
    successMessage?: string | ((updated: RoomData) => string)
  ) => {
    if (!isAdmin || !roomData) return;
    try {
      setIsUpdatingRoomConfig(true);
      const updated = roomCode
        ? await collabApi.updateRoomSettingsByCode(roomCode, payload)
        : await collabApi.updateRoomSettings(roomData.id, payload);

      setRoomData(updated);
      if (isConnected) {
        voiceWs.publishChat({
          isAdminAction: true,
          action: 'SYNC_ROOM_SETTINGS',
          roomSettings: updated,
          displayName: getDisplayName(),
          message: ''
        });
      }
      const resolvedMessage = typeof successMessage === 'function'
        ? successMessage(updated)
        : (successMessage || 'Room settings updated');
      toast.success(resolvedMessage);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update room settings');
    } finally {
      setIsUpdatingRoomConfig(false);
    }
  }, [isAdmin, roomData, roomCode, isConnected]);

  const handleToggleRoomConfig = useCallback((setting: 'codeOpen' | 'whiteboardEnabled', value: boolean) => {
    if (setting === 'codeOpen') {
      handleUpdateRoomConfig(
        { codeOpen: value },
        (updated) => `Room join-by-code is now ${updated.codeOpen ? 'open' : 'invite-only'}`
      );
    } else {
      handleUpdateRoomConfig(
        { whiteboardEnabled: value },
        (updated) => `Whiteboard is now ${updated.whiteboardEnabled ? 'enabled' : 'disabled'}`
      );
    }
  }, [handleUpdateRoomConfig]);

  const handleSetMode = useCallback((mode: 'INTERVIEW' | 'TEAM') => {
    handleUpdateRoomConfig(
      { collaborationMode: mode },
      mode === 'INTERVIEW' ? 'Interview mode enabled (chat on, screen share off, host-controlled edits/tasks)' : 'Team mode enabled (open join, chat on, screen share on)'
    );
  }, [handleUpdateRoomConfig]);

  const handleToggleEditorGrant = useCallback((tool: 'whiteboard' | 'code', userId: string) => {
    if (!roomData || !isHost) return;
    const current = tool === 'whiteboard'
      ? [...(roomData.whiteboardEditorUserIds || [])]
      : [...(roomData.codeEditorUserIds || [])];

    const idx = current.indexOf(userId);
    const next = idx >= 0 ? current.filter(id => id !== userId) : [...current, userId];
    const payload: RoomSettingsUpdatePayload = tool === 'whiteboard'
      ? { whiteboardEditorUserIds: next }
      : { codeEditorUserIds: next };
    const target = participants.find(p => p.id === userId);
    const targetName = target?.label || 'user';

    handleUpdateRoomConfig(
      payload,
      tool === 'whiteboard'
        ? `Whiteboard edit ${idx >= 0 ? 'revoked' : 'granted'} for ${targetName}`
        : `Code edit ${idx >= 0 ? 'revoked' : 'granted'} for ${targetName}`
    );
  }, [roomData, isHost, handleUpdateRoomConfig, participants]);

  const handleSendChat = useCallback(() => {
    if (!chatMessage.trim()) return;
    if (isChatDisabled) return;
    const name = getDisplayName();
    voiceWs.publishChat({ message: chatMessage.trim(), displayName: name });
    setChatMessages(prev => [...prev, {
      id: ++chatIdRef.current, senderId: 'local', displayName: name,
      message: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#D4AF37', avatar: name.substring(0, 2).toUpperCase(),
    }]);
    setChatMessage('');
  }, [chatMessage, isChatDisabled]);

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
    setIsMuteAllActive(true);
    voiceWs.publishChat({
      isAdminAction: true,
      action: 'MUTE_ALL',
      displayName: getDisplayName(),
      message: `🔇 ${getDisplayName()} muted everyone`,
    });
    setChatMessages(prev => [...prev, {
      id: ++chatIdRef.current, senderId: 'system', displayName: 'System',
      message: `🔇 You muted everyone`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#A1A1AA', avatar: '⚡', isSystem: true,
    }]);
  }, []);

  const handleUnmuteAll = useCallback(() => {
    setIsMuteAllActive(false);
    setIsForceMutedByHost(false);
    voiceWs.publishChat({
      isAdminAction: true,
      action: 'UNMUTE_ALL',
      displayName: getDisplayName(),
      message: `🎙️ ${getDisplayName()} removed mute-all lock`,
    });
    setChatMessages(prev => [...prev, {
      id: ++chatIdRef.current, senderId: 'system', displayName: 'System',
      message: `🎙️ You removed mute-all lock. Participants can unmute themselves now.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: '#A1A1AA', avatar: '⚡', isSystem: true,
    }]);
  }, []);

  const handleMicToggle = useCallback(() => {
    if (isForceMutedByHost && voiceMuted) {
      toast.info('Host muted everyone. Wait for "Unmute All" to speak.');
      return;
    }
    toggleMute();
  }, [isForceMutedByHost, voiceMuted, toggleMute]);

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
      color: '#A1A1AA', avatar: '⚡', isSystem: true,
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
      if (isScreenShareDisabled) {
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
  }, [isLocalScreenSharing, isScreenShareDisabled, beginScreenShare, endScreenShare, currentUserId]);

  const publishTasksIfShared = useCallback((nextTasks: LocalTask[], event?: { action: 'ADDED' | 'UPDATED' | 'REMOVED'; taskText?: string }) => {
    if (!roomData || roomData.taskVisibility !== 'PUBLIC') return;
    voiceWs.publishChat({
      isTaskSync: true,
      tasks: nextTasks,
      taskEvent: event,
      displayName: getDisplayName(),
      message: ''
    });
  }, [roomData]);

  const handleAddTask = () => {
    if (!canMutateTasks) {
      toast.error('Only the host can update tasks in this room mode');
      return;
    }
    if (!newTaskText.trim()) return;
    const addedTaskText = newTaskText.trim();
    const nextTasks = [...tasks, { id: ++taskIdRef.current, text: addedTaskText, done: false }];
    setTasks(nextTasks);
    setNewTaskText('');
    publishTasksIfShared(nextTasks, { action: 'ADDED', taskText: addedTaskText });
    toast.success(`Task added: ${addedTaskText}`);
  };

  const toggleTask = (id: number) => {
    if (!canMutateTasks) {
      toast.error('Only the host can update tasks in this room mode');
      return;
    }
    const nextTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(nextTasks);
    publishTasksIfShared(nextTasks, { action: 'UPDATED' });
  };

  const removeTask = (id: number) => {
    if (!canMutateTasks) {
      toast.error('Only the host can update tasks in this room mode');
      return;
    }
    const nextTasks = tasks.filter(t => t.id !== id);
    setTasks(nextTasks);
    publishTasksIfShared(nextTasks, { action: 'REMOVED' });
  };

  const togglePanel = (panel: SidePanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  const handleCopyRoomCode = () => {
    if (!roomCode || isInterviewMode) return;
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
    if (chatSubscriptionRef.current) {
      chatSubscriptionRef.current.unsubscribe();
      chatSubscriptionRef.current = null;
    }

    const subscription = voiceWs.subscribeChat((payload: any) => {
      if (payload.isHandRaise) {
        const peerId = payload.senderId;
        if (peerId !== currentUserId) {
          if (payload.raised) {
            setRaisedHands(prev => new Set([...prev, peerId]));
            const nId = ++handNotifIdRef.current;
            setHandNotifications(prev => [...prev, { id: nId, name: payload.displayName || peerNames.get(peerId) || 'Someone' }]);
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
        if (payload.taskEvent?.action === 'ADDED' && payload.taskEvent?.taskText) {
          const fromName = payload.displayName || peerNames.get(payload.senderId) || 'A participant';
          toast.info(`${fromName} added task: ${payload.taskEvent.taskText}`);
        }
        return;
      }
      if (payload.isAdminAction) {
        if (payload.action === 'SYNC_ROOM_SETTINGS' && payload.roomSettings) {
          setRoomData(payload.roomSettings);
          return;
        }
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
        if (payload.action === 'MUTE_ALL') {
          if (payload.targetId && payload.targetId !== currentUserId) {
            return;
          }
          setIsMuteAllActive(true);
          if (payload.senderId !== currentUserId) {
            if (!voiceMuted) {
              toggleMute();
            }
            setIsForceMutedByHost(true);
            setChatMessages(prev => [...prev, {
              id: ++chatIdRef.current, senderId: 'system', displayName: 'System',
              message: `🔇 ${payload.displayName || 'Host'} muted everyone`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              color: '#A1A1AA', avatar: '⚡', isSystem: true,
            }]);
          }
          return;
        }
        if (payload.action === 'UNMUTE_ALL') {
          if (payload.targetId && payload.targetId !== currentUserId) {
            return;
          }
          setIsMuteAllActive(false);
          setIsForceMutedByHost(false);
          if (payload.senderId !== currentUserId) {
            setChatMessages(prev => [...prev, {
              id: ++chatIdRef.current, senderId: 'system', displayName: 'System',
              message: `🎙️ ${payload.displayName || 'Host'} removed mute-all lock. You can unmute now.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              color: '#A1A1AA', avatar: '⚡', isSystem: true,
            }]);
          }
          return;
        }
        return;
      }
      if (payload.isPresence) {
        // Enforce mute-all for users who join after mute-all was enabled.
        if (isHost && isMuteAllActive && payload.senderId && payload.senderId !== currentUserId) {
          voiceWs.publishChat({
            isAdminAction: true,
            action: 'MUTE_ALL',
            targetId: payload.senderId,
            displayName: getDisplayName(),
            message: '',
          });
        }
        return;
      }
      if (payload.isReaction) {
        const id = ++reactionIdRef.current;
        setFloatingReactions(prev => [...prev, { id, emoji: payload.message, x: 30 + Math.random() * 40 }]);
        setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
        return;
      }
      const incomingSenderId = payload.senderId || 'unknown';
      const incomingText = (payload.message || '').trim();

      // Hard guard for self-echoes if sender id format differs between flows.
      if (!payload.isSystem && incomingSenderId === currentUserId) {
        return;
      }

      // Short-window dedupe to avoid double render from rapid resubscribe/broker replay.
      if (!payload.isSystem && incomingText) {
        const dedupeKey = `${incomingSenderId}::${incomingText}`;
        const now = Date.now();
        if (lastIncomingChatRef.current && lastIncomingChatRef.current.key === dedupeKey && now - lastIncomingChatRef.current.at < 1500) {
          return;
        }
        lastIncomingChatRef.current = { key: dedupeKey, at: now };
      }

      setChatMessages(prev => [...prev, {
        id: ++chatIdRef.current,
        senderId: incomingSenderId,
        displayName: payload.displayName || peerNames.get(payload.senderId) || 'User',
        message: payload.message || '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: payload.isSystem ? '#A1A1AA' : getColor(incomingSenderId || 'x'),
        avatar: payload.isSystem ? '⚡' : (payload.displayName || peerNames.get(payload.senderId) || 'U').substring(0, 2).toUpperCase(),
        isSystem: payload.isSystem,
      }]);
    });

    chatSubscriptionRef.current = subscription || null;
    voiceWs.publishChat({ displayName: getDisplayName(), message: '', isPresence: true });

    return () => {
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe();
        chatSubscriptionRef.current = null;
      }
    };
  }, [isConnected, roomData, leaveCall, navigate, currentUserId, phase, peerNames, isHost, isMuteAllActive, voiceMuted, toggleMute]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const hasPanelOpen = activePanel !== 'none';
      if (!isDragging.current || !containerRef.current || isWorkspacePanel || !hasPanelOpen) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextPercent = ((rect.right - e.clientX) / rect.width) * 100;
      const clamped = Math.max(22, Math.min(46, nextPercent));
      setSidebarWidth(clamped);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [activePanel, isWorkspacePanel]);

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
    if (!canEditCode) return;

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
  }, [editorCode, isConnected, roomData, phase, canEditCode]);

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
    if (isScreenShareDisabled && isLocalScreenSharing) {
      toast.info("Screen sharing was disabled by admin");
      endScreenShare();
    }
  }, [isScreenShareDisabled, isLocalScreenSharing, endScreenShare]);

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
    }
  }, [isLocalScreenSharing]);

  // Pin remote sharer for consistent focus in grid mode
  useEffect(() => {
    const sharingPeers = Array.from(remoteScreenStreams.keys());
    if (sharingPeers.length > 0) {
      setPinnedPeer(sharingPeers[0]);
    }
  }, [remoteScreenStreams.size]);

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
    <div className="h-screen bg-[#09090B] text-white overflow-hidden relative flex flex-col">
      <CosmicStars />
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-[#D4AF37] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-[#A1A1AA] rounded-full blur-[150px]" />
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#09090B]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0D0D0F] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D4AF37]" />
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#D4AF37]/40 appearance-none cursor-pointer"
                >
                  {devices.videoIn.map(d => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-[#0D0D0F]">{d.label || 'Default Camera'}</option>
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#D4AF37]/40 appearance-none cursor-pointer"
                >
                  {devices.audioIn.map(d => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-[#0D0D0F]">{d.label || 'Default Microphone'}</option>
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
                className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/80 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
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
            className="flex items-center gap-3 px-4 py-3 bg-[#0D0D0F]/95 backdrop-blur-xl border border-[#F59E0B]/30 rounded-xl shadow-xl animate-slide-in pointer-events-auto"
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
      <div className="bg-[#09090B]/95 backdrop-blur-md border-b border-white/5 px-6 py-3 flex-shrink-0 relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-white/90">{roomData?.name || 'Meeting Room'}</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyRoomCode}
                  disabled={isInterviewMode}
                  title={isInterviewMode ? 'Disabled in interview mode' : 'Copy room link'}
                  className={`flex items-center gap-2 px-2 py-0.5 border rounded-lg transition-all group ${isInterviewMode ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
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
        {isWorkspacePanel ? (
          <div className="flex-1 min-w-0 p-3 flex gap-4 overflow-hidden">
            <div className="flex-1 min-w-0 flex flex-col rounded-2xl overflow-hidden bg-[#0A101B] border border-white/8 shadow-2xl">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-[#09090B]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/85 capitalize">
                  {activePanel === 'code' ? (
                    <><Code2 className="w-4 h-4" /> Code Workspace</>
                  ) : (
                    <><PenTool className="w-4 h-4" /> Whiteboard Workspace</>
                  )}
                </div>
                <div className="text-[11px] text-white/35">
                  {activePanel === 'code' ? (canEditCode ? 'Editable' : 'View only') : (canEditWhiteboard ? 'Editable' : 'View only')}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {activePanel === 'code' ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 flex-shrink-0 bg-[#09090B]/70">
                      {!canEditCode && (
                        <span className="text-[11px] px-2 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">View only (host grant required)</span>
                      )}
                      <div className="relative">
                        <button onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/80 hover:bg-white/[0.07]">
                          <span>{selectedLang?.label || 'Language'}</span>
                          <ChevronDown className={`w-3 h-3 text-white/40 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isLangDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-36 bg-[#0D0D0F]/95 border border-white/10 rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-auto">
                            {LANGUAGES.map(l => (<button key={l.value} onClick={() => { setEditorLanguage(l.value); setIsLangDropdownOpen(false); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-white/5 ${editorLanguage === l.value ? 'text-[#D4AF37]' : 'text-white/80'}`}>{l.label}</button>))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1"><Editor height="100%" language={editorLanguage} value={editorCode} onChange={v => setEditorCode(v || '')} theme="vs-dark" options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 8 }, lineNumbers: 'on', wordWrap: 'on', tabSize: 2, automaticLayout: true, readOnly: !canEditCode }} /></div>
                  </div>
                ) : (
                  roomData?.whiteboardEnabled ? (
                    canViewWhiteboard ? (
                      <div className="h-full bg-white relative"><Whiteboard canEdit={canEditWhiteboard} /></div>
                    ) : (
                      <div className="h-full bg-[#09090B] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                        Whiteboard is private in this room mode.
                      </div>
                    )
                  ) : (
                    <div className="h-full bg-[#09090B] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                      Whiteboard is disabled by room host.
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="w-[360px] flex-shrink-0 flex flex-col rounded-2xl overflow-hidden bg-[#0D0D0F] border border-white/8 shadow-2xl min-h-0">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <LayoutGrid className="w-4 h-4" /> Participants
                </div>
                <div className="text-[11px] text-white/35">{participants.length} live</div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 auto-rows-[minmax(150px,1fr)]">
                  {participants.map(p => (
                    <div key={p.id} className="min-w-0">
                      {renderParticipantTile(p, true)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
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
              ) : (
                /* GRID LAYOUT */
                <div
                  className="flex-1 grid gap-3 min-h-0"
                  style={{
                    gridTemplateColumns: `repeat(${remoteParticipants.length > 0 ? Math.max(1, Math.min(3, remoteParticipants.length)) : gridCols}, 1fr)`,
                    gridAutoRows: '1fr'
                  }}
                >
                  {(remoteParticipants.length > 0 ? remoteParticipants : participants).map(p => (
                    <div key={p.id} className="min-w-0 min-h-0">
                      {renderParticipantTile(p)}
                    </div>
                  ))}
                </div>
              )}

              {remoteParticipants.length > 0 && localParticipant && !isLocalScreenSharing && (
                <div className="absolute bottom-4 right-4 w-[220px] sm:w-[250px] max-w-[42%] z-30 rounded-2xl shadow-2xl ring-2 ring-white/20 bg-[#09090B]/80 backdrop-blur-sm p-1">
                  {renderParticipantTile(localParticipant, true)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESIZE HANDLE */}
        {!isWorkspacePanel && hasSidePanel && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1.5 flex-shrink-0 bg-white/5 hover:bg-[#D4AF37]/30 active:bg-[#D4AF37]/50 cursor-col-resize transition-colors flex items-center justify-center group z-20"
          >
            <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/60" />
          </div>
        )}

        {/* SIDEBAR PANEL (Chat, Notes, etc.) */}
        {!isWorkspacePanel && hasSidePanel && (
          <div className="flex flex-col bg-[#09090B] border-l border-white/5 min-w-0" style={{ width: `${sidebarWidth}%` }}>
            {/* Panel header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 flex-shrink-0">
              <h3 className="text-sm font-semibold text-white/80 capitalize flex items-center gap-2">
                {activePanel === 'chat' && <><MessageCircle className="w-4 h-4" /> Chat</>}
                {activePanel === 'code' && <><Code2 className="w-4 h-4" /> Code</>}
                {activePanel === 'whiteboard' && <><PenTool className="w-4 h-4" /> Whiteboard</>}
                {activePanel === 'tasks' && <><ListTodo className="w-4 h-4" /> Tasks</>}
                {activePanel === 'people' && <><Users className="w-4 h-4" /> People</>}
                {activePanel === 'notes' && <><FileText className="w-4 h-4" /> Notes</>}
                {activePanel === 'controls' && <><Shield className="w-4 h-4" /> Meeting Controls</>}
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
                      placeholder={isChatDisabled ? "Chat is disabled by admin" : "Send a message..."}
                      disabled={isChatDisabled}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30 min-w-0" 
                    />
                    <button 
                      onClick={handleSendChat} 
                      disabled={!chatMessage.trim() || isChatDisabled} 
                      className="p-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg disabled:opacity-40 flex-shrink-0"
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80 focus:outline-none focus:border-[#D4AF37]/30 resize-none placeholder:text-white/20 leading-relaxed"
                  />
                </div>
              )}

              {/* CODE PANEL */}
              {activePanel === 'code' && (
                canViewCode ? (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 flex-shrink-0">
                    {!canEditCode && (
                      <span className="text-[11px] px-2 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">View only (host grant required)</span>
                    )}
                    <div className="relative">
                      <button onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/80 hover:bg-white/[0.07]">
                        <span>{selectedLang?.label || 'Language'}</span>
                        <ChevronDown className={`w-3 h-3 text-white/40 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isLangDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-36 bg-[#0D0D0F]/95 border border-white/10 rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-auto">
                          {LANGUAGES.map(l => (<button key={l.value} onClick={() => { setEditorLanguage(l.value); setIsLangDropdownOpen(false); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-white/5 ${editorLanguage === l.value ? 'text-[#D4AF37]' : 'text-white/80'}`}>{l.label}</button>))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1"><Editor height="100%" language={editorLanguage} value={editorCode} onChange={v => setEditorCode(v || '')} theme="vs-dark" options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 8 }, lineNumbers: 'on', wordWrap: 'on', tabSize: 2, automaticLayout: true, readOnly: !canEditCode }} /></div>
                </div>
                ) : (
                  <div className="flex-1 bg-[#09090B] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
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
                    <div className="flex-1 bg-[#09090B] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                      Whiteboard is private in this room mode.
                    </div>
                  )
                ) : (
                  <div className="flex-1 bg-[#09090B] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
                    Whiteboard is disabled by room host.
                  </div>
                )
              )}

              {/* TASKS PANEL */}
              {activePanel === 'tasks' && (
                canViewTasks ? (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }} placeholder={canMutateTasks ? "Add a task..." : "Host-only task editing in this mode"} disabled={!canMutateTasks} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30 min-w-0 disabled:opacity-50" />
                    <button onClick={handleAddTask} disabled={!newTaskText.trim() || !canMutateTasks} className="px-3 py-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg text-xs disabled:opacity-40">Add</button>
                  </div>
                  {tasks.length === 0 && <div className="text-center text-white/20 text-sm py-6"><ListTodo className="w-8 h-8 mx-auto mb-2 opacity-30" />No tasks</div>}
                  {tasks.map(t => (<div key={t.id} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg mb-1.5 group"><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} disabled={!canMutateTasks} className="w-3.5 h-3.5 accent-[#D4AF37] disabled:opacity-50" /><span className={`text-sm flex-1 ${t.done ? 'line-through text-white/30' : ''}`}>{t.text}</span><button onClick={() => removeTask(t.id)} disabled={!canMutateTasks} className="text-white/20 hover:text-[#EF6461] opacity-0 group-hover:opacity-100 text-xs disabled:opacity-30">✕</button></div>))}
                </div>
                ) : (
                  <div className="flex-1 bg-[#09090B] flex items-center justify-center text-sm text-white/60 border border-white/10 rounded-xl m-2">
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
                        disabled={!canInviteMembers}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30 min-w-0"
                      />
                      <button
                        onClick={handleInviteUser}
                        disabled={!inviteInput.trim() || isInviting || !canInviteMembers}
                        className="p-2 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-lg disabled:opacity-40 flex-shrink-0"
                      >
                        {isInviting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                    {inviteStatus && (
                      <p className="text-xs text-white/60">{inviteStatus}</p>
                    )}
                    {!canInviteMembers && roomData?.collaborationMode === 'INTERVIEW' && (
                      <p className="text-xs text-white/50">Interview mode: only the host can invite participants.</p>
                    )}
                  </div>

                  {!isInterviewMode && (
                    <>
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
                            title="Copy meeting link"
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 ${inviteCopied ? 'bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30' : 'bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90'}`}
                          >
                            {inviteCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                      </div>

                      {/* Room code */}
                      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-white/40 uppercase tracking-wide">Room Code</div>
                          <div className="text-sm font-mono font-semibold text-white">{roomCode}</div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(roomCode || '');
                            setInviteCopied(true);
                            setTimeout(() => setInviteCopied(false), 2000);
                          }}
                          title="Copy room code"
                          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                        >
                          <Copy className="w-3.5 h-3.5 text-white/40" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] text-white/30 uppercase">{participants.length} in meeting</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

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
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F59E0B] rounded-full flex items-center justify-center">
                              <Crown className="w-2 h-2 text-black" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white/90 truncate">{p.label}</span>
                            {p.isAdmin && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded-md font-semibold">
                                {roomData?.createdBy === p.id ? 'HOST' : 'ADMIN'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/40">{p.isLocal ? 'You' : 'Connected'}</div>
                          {isHost && !p.isLocal && (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={() => handleToggleEditorGrant('whiteboard', p.id)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${roomData?.whiteboardEditorUserIds?.includes(p.id) ? 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#86EFAC]' : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10'}`}
                              >
                                WB Edit
                              </button>
                              <button
                                onClick={() => handleToggleEditorGrant('code', p.id)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${roomData?.codeEditorUserIds?.includes(p.id) ? 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#86EFAC]' : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10'}`}
                              >
                                Code Edit
                              </button>
                            </div>
                          )}
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
                          <div className="absolute right-0 top-full mt-1 w-44 bg-[#0D0D0F]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                            {!p.isAdmin && (
                              <button
                                onClick={() => handlePromotePeer(p.id, p.label)}
                                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-white/5 text-white/80"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
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

              {/* MEETING CONTROLS PANEL */}
              {activePanel === 'controls' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {isAdmin ? (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={isMuteAllActive ? handleUnmuteAll : handleMuteAll}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${isMuteAllActive ? 'bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#4ADE80] hover:bg-[#4ADE80]/25' : 'bg-[#EF6461]/15 border border-[#EF6461]/30 text-[#EF6461] hover:bg-[#EF6461]/25'}`}
                        >
                          {isMuteAllActive ? <Mic className="w-3.5 h-3.5" /> : <VolumeXIcon className="w-3.5 h-3.5" />}
                          {isMuteAllActive ? 'Unmute All' : 'Mute All'}
                        </button>
                      </div>
                      <div className={`px-3 py-2 rounded-xl border text-[11px] ${isMuteAllActive ? 'bg-[#F59E0B]/12 border-[#F59E0B]/35 text-[#F59E0B]' : 'bg-white/5 border-white/10 text-white/45'}`}>
                        {isMuteAllActive ? 'Mute-all lock is active. New joiners will be muted.' : 'Mute-all lock is inactive.'}
                      </div>

                      <div className="space-y-2 pb-2">
                        <label className="text-[10px] font-medium text-white/30 uppercase tracking-wider px-1">Room Security</label>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSetMode('INTERVIEW')}
                            disabled={isUpdatingRoomConfig}
                            className={`flex items-center justify-center px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${roomData?.collaborationMode === 'INTERVIEW' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                            <span className="text-xs font-medium">Interview</span>
                          </button>
                          <button
                            onClick={() => handleSetMode('TEAM')}
                            disabled={isUpdatingRoomConfig}
                            className={`flex items-center justify-center px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${roomData?.collaborationMode === 'TEAM' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                            <span className="text-xs font-medium">Team</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleToggleRoomConfig('codeOpen', !(roomData?.codeOpen ?? false))}
                            disabled={isUpdatingRoomConfig}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${roomData?.codeOpen ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <LockIcon className="w-3.5 h-3.5" />
                              Open Join
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${roomData?.codeOpen ? 'bg-[#F59E0B]' : 'bg-white/20'}`}>
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
                            disabled={isUpdatingRoomConfig}
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
                              disabled={true}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl border bg-white/5 border-white/10 text-white/50 opacity-70"
                            >
                              <span className="text-xs">WB Edit Host + user grants</span>
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
                          <p className="text-[11px] text-white/40 px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                            🔒 Restrictive: Invite-only join • Chat enabled • Screen share disabled • Whiteboard/Code view-only (host grants edit) • Tasks host-only edits.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full min-h-[220px] flex items-center justify-center rounded-xl border border-white/10 bg-[#09090B] text-sm text-white/50">
                      Only admins can access meeting controls.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM CONTROL BAR ──────────────────────── */}
      <div className="bg-[#09090B]/95 backdrop-blur-md border-t border-white/5 px-6 py-3 flex-shrink-0 relative z-20">
        <div className="flex items-center justify-between gap-3 w-full max-w-7xl mx-auto">
          {/* Left: time */}
          <div className="text-sm text-white/40 flex-shrink-0 min-w-[72px] sm:min-w-[92px]">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Center: main controls */}
          <div className="flex items-center gap-2">
            <button onClick={handleMicToggle} className={`p-3 rounded-full transition-all ${voiceMuted ? 'bg-[#EF6461] text-white' : 'bg-white/10 hover:bg-white/15'}`} title={voiceMuted ? 'Unmute' : 'Mute'}>
              {voiceMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button onClick={toggleVideo} className={`p-3 rounded-full transition-all ${!isVideoEnabled ? 'bg-[#EF6461] text-white' : 'bg-white/10 hover:bg-white/15'}`} title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`p-3 rounded-full transition-all ${!isSpeakerOn ? 'bg-[#EF6461] text-white' : 'bg-white/10 hover:bg-white/15'}`} title={isSpeakerOn ? 'Deafen' : 'Undeafen'}>
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            <button 
              onClick={handleScreenShare} 
              className={`p-3 rounded-xl transition-all ${isLocalScreenSharing ? 'bg-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/20' : 'bg-white/5 text-white/70 hover:bg-white/10'} ${isScreenShareDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isScreenShareDisabled ? "Disabled by host setting" : (isLocalScreenSharing ? "Stop sharing" : "Share screen")}
            >
              {isLocalScreenSharing ? <MonitorUp className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
            </button>

            <button onClick={handleRaiseHand} className={`p-3 rounded-full transition-all ${isHandRaised ? 'bg-[#F59E0B] text-black' : 'bg-white/10 hover:bg-white/15'}`} title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
              <Hand className="w-5 h-5" />
            </button>

            {/* Reactions */}
            <div className="relative">
              <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="p-3 rounded-full bg-white/10 hover:bg-white/15 transition-all" title="Send a reaction">
                <SmilePlus className="w-5 h-5" />
              </button>
              {showReactionPicker && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0D0D0F]/95 border border-white/10 rounded-2xl shadow-2xl p-2 flex gap-1">
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
          <div className="flex items-center gap-1 justify-end flex-shrink-0 min-w-fit">
            <button onClick={() => togglePanel('people')} className={`p-2 rounded-lg transition-all ${activePanel === 'people' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/60'}`} title="People">
              <UserPlus className="w-5 h-5" />
            </button>
            <button onClick={() => togglePanel('chat')} className={`p-2 rounded-lg transition-all relative ${activePanel === 'chat' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/60'}`} title="Chat">
              <MessageCircle className="w-5 h-5" />
              {chatMessages.length > 0 && activePanel !== 'chat' && <div className="absolute top-1 right-1 w-2 h-2 bg-[#D4AF37] rounded-full" />}
            </button>
            <button onClick={() => canViewCode && togglePanel('code')} className={`p-2 rounded-lg transition-all ${!canViewCode ? 'opacity-50 cursor-not-allowed text-white/30' : (activePanel === 'code' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/60')}`} title={canViewCode ? 'Code' : 'Code is private'}>
              <Code2 className="w-5 h-5" />
            </button>
            <button onClick={() => roomData?.whiteboardEnabled && canViewWhiteboard && togglePanel('whiteboard')} className={`p-2 rounded-lg transition-all ${(roomData?.whiteboardEnabled === false || !canViewWhiteboard) ? 'opacity-50 cursor-not-allowed text-white/30' : (activePanel === 'whiteboard' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/60')}`} title={roomData?.whiteboardEnabled === false ? "Whiteboard disabled by host" : (canViewWhiteboard ? "Whiteboard" : "Whiteboard is private")}>
              <PenTool className="w-5 h-5" />
            </button>
            <button onClick={() => canViewTasks && togglePanel('tasks')} className={`p-2 rounded-lg transition-all ${!canViewTasks ? 'opacity-50 cursor-not-allowed text-white/30' : (activePanel === 'tasks' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/60')}`} title={canViewTasks ? 'Tasks' : 'Tasks are private'}>
              <ListTodo className="w-5 h-5" />
            </button>
            <button onClick={() => isAdmin && togglePanel('controls')} className={`p-2 rounded-lg transition-all ${!isAdmin ? 'opacity-50 cursor-not-allowed text-white/30' : (activePanel === 'controls' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/60')}`} title={isAdmin ? 'Meeting Controls' : 'Admins only'}>
              <Shield className="w-5 h-5" />
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
