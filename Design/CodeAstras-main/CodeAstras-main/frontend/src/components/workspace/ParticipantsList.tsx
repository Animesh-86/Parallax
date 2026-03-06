import { UserPlus, Crown, Code, Eye } from 'lucide-react';

export function ParticipantsList() {
  const participants = [
    { id: 1, name: 'You', avatar: 'YO', role: 'Owner', status: 'online', color: '#B043FF' },
    { id: 2, name: 'Alex Chen', avatar: 'AC', role: 'Editor', status: 'online', color: '#2BCBFF' },
    { id: 3, name: 'Sarah Kim', avatar: 'SK', role: 'Editor', status: 'online', color: '#3DF6FF' },
    { id: 4, name: 'Mike Ross', avatar: 'MR', role: 'Viewer', status: 'away', color: '#666' },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner':
        return <Crown className="w-3 h-3" />;
      case 'Editor':
        return <Code className="w-3 h-3" />;
      case 'Viewer':
        return <Eye className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-white/5 bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="text-sm text-white/90">Project Alpha</div>
        <button className="p-2 hover:bg-white/10 rounded transition-colors" title="Invite user">
          <UserPlus className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Participants list */}
      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group"
          >
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm"
                style={{
                  backgroundColor: `${participant.color}20`,
                  borderColor: participant.color,
                  color: participant.color,
                  fontWeight: '600'
                }}
              >
                {participant.avatar}
              </div>
              
              {/* Status indicator */}
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f0f0f] ${
                  participant.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
            </div>

            {/* Name and role */}
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate text-white/90">{participant.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                {getRoleIcon(participant.role)}
                <span>{participant.role}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 hover:bg-white/10 rounded text-xs text-white/60 hover:text-white">
                ···
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite button */}
      <div className="p-3 border-t border-white/5">
        <button className="w-full px-4 py-2 bg-gradient-to-r from-[#7c3aed] to-[#0ea5e9] rounded-xl hover:shadow-lg hover:shadow-[#7c3aed]/30 transition-all duration-300 text-sm flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invite to Workspace
        </button>
      </div>
    </div>
  );
}