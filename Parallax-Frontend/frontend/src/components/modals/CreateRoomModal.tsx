import { useState } from 'react';
import { X, Users, Sparkles, Copy, Check, ExternalLink, Link2 } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomName: string, collaborationMode: 'INTERVIEW' | 'TEAM') => Promise<{ roomCode: string; name: string } | void>;
  onJoinRoom?: (roomCode: string) => void;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
}: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaborationMode, setCollaborationMode] = useState<'INTERVIEW' | 'TEAM'>('TEAM');

  // Step 2 state
  const [createdRoom, setCreatedRoom] = useState<{ roomCode: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomLink = createdRoom ? `${window.location.origin}/room/${createdRoom.roomCode}` : '';

  const handleCreate = async () => {
    if (!roomName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await onCreateRoom(roomName.trim(), collaborationMode);
      if (result) {
        // Move to step 2 instead of closing
        setCreatedRoom(result);
      }
    } catch (err) {
      console.error('Modal: error from onCreateRoom', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (!createdRoom) return;
    navigator.clipboard.writeText(createdRoom.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (createdRoom && onJoinRoom) {
      onJoinRoom(createdRoom.roomCode);
    }
    handleClose();
  };

  const handleClose = () => {
    // Reset all state
    setRoomName('');
    setCollaborationMode('TEAM');
    setCreatedRoom(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const handleBackdropClick = () => {
    if (!isSubmitting) handleClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleBackdropClick}
      />

      {/* Modal container */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="relative bg-[#09090B]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                      createdRoom 
                        ? 'bg-gradient-to-br from-[#4ADE80]/20 to-[#D4AF37]/20 border-[#4ADE80]/30'
                        : 'bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 border-[#D4AF37]/30'
                    }`}>
                      {createdRoom ? (
                        <Check className="w-6 h-6 text-[#4ADE80]" />
                      ) : (
                        <Users className="w-6 h-6 text-[#D4AF37]" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                      {createdRoom ? 'Room Created!' : 'Create New Room'}
                    </h2>
                    <p className="text-sm text-white/40 mt-1">
                      {createdRoom 
                        ? 'Share the link to invite participants'
                        : 'Start a standalone real-time meeting'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all group"
              >
                <X className="w-5 h-5 text-white/60 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* STEP 1: Create Form */}
          {!createdRoom && (
            <>
              <div className="px-8 py-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Meeting Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Weekly Standup, Design Review..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.07] transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreate();
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">Mode</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setCollaborationMode('INTERVIEW')}
                      className={`p-3 rounded-xl border text-left transition-all ${collaborationMode === 'INTERVIEW' ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="text-sm font-semibold text-white">Interview Mode</div>
                      <div className="text-xs text-white/50 mt-1">Restrictive: invite-only, whiteboard public with host-only editing, code/tasks public.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollaborationMode('TEAM')}
                      className={`p-3 rounded-xl border text-left transition-all ${collaborationMode === 'TEAM' ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="text-sm font-semibold text-white">Team Mode</div>
                      <div className="text-xs text-white/50 mt-1">Flexible: host can customize private/public behavior for whiteboard, code, and tasks.</div>
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-[#EF6461]">{error}</p>
                )}
              </div>

              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!roomName.trim() || isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-xl font-medium text-white hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    <Sparkles className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">
                      {isSubmitting ? 'Creating...' : 'Create Room'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Room Created — Share & Join */}
          {createdRoom && (
            <>
              <div className="px-8 py-6 space-y-5">
                {/* Room Name Display */}
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">{createdRoom.name}</div>
                    <div className="text-xs text-white/40">Room Code: {createdRoom.roomCode}</div>
                  </div>
                </div>

                {/* Invite Link */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Invite Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 font-mono truncate">
                      {roomLink}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 flex-shrink-0 ${
                        copied
                          ? 'bg-[#4ADE80]/20 border-[#4ADE80]/30 text-[#4ADE80]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Room Code Copy */}
                <div className="flex items-center gap-3 p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl">
                  <div className="text-sm text-white/50 flex-1">
                    Share the <strong className="text-white/80">room code</strong> or <strong className="text-white/80">invite link</strong> with others to let them join.
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </button>
                  <button
                    type="button"
                    onClick={handleJoin}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#4ADE80] to-[#D4AF37] rounded-xl font-medium text-white hover:shadow-xl hover:shadow-[#4ADE80]/40 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    <ExternalLink className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Join Room</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
