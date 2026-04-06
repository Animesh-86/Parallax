import { useState } from "react";

type CreateRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string) => Promise<void> | void;
  onJoinRoom: (code: string) => void;
};

export function CreateRoomModal({ isOpen, onClose, onCreateRoom, onJoinRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    const trimmed = roomName.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onCreateRoom(trimmed);
      setRoomName("");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = () => {
    const trimmed = roomCode.trim();
    if (!trimmed || busy) return;
    onJoinRoom(trimmed);
    setRoomCode("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#060910] p-6 text-white shadow-2xl">
        <h2 className="text-xl font-semibold">Create or Join Room</h2>
        <p className="mt-1 text-sm text-white/60">Start a new room or join with a room code.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Room name</label>
            <input
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-[#38BDF8]"
              placeholder="Design Sync"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] px-4 py-2 font-medium disabled:opacity-50"
              onClick={handleCreate}
              disabled={busy || !roomName.trim()}
            >
              {busy ? "Creating..." : "Create Room"}
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Join code</label>
            <input
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-[#38BDF8]"
              placeholder="ROOM123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <button
              className="mt-3 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 font-medium hover:bg-white/10 disabled:opacity-50"
              onClick={handleJoin}
              disabled={busy || !roomCode.trim()}
            >
              Join Room
            </button>
          </div>
        </div>

        <button className="mt-5 w-full text-sm text-white/60 hover:text-white" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
