import { UserPlus, Crown, Code, Eye, MoreVertical, Trash2, ChevronDown, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCollab } from '../../context/CollaborationContext';
import { collabApi } from '../../services/collabApi';
import { toast } from 'sonner';
import { profileService } from '../../services/profileService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function ParticipantsList() {
  const { projectId } = useParams();
  const { currentCollaborators, refreshCollaborators } = useCollab();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteRole, setInviteRole] = useState<'COLLABORATOR' | 'VIEWER'>('COLLABORATOR');
  const [isInviting, setInviting] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [collaboratorNames, setCollaboratorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (projectId) {
      refreshCollaborators(projectId);
    }
  }, [projectId, refreshCollaborators]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const newNames: Record<string, string> = {};
      const promises = currentCollaborators.map(async (c) => {
        const realId = c.id || c.userId;
        if (!realId) return;

        // If we don't have a name cached for this ID yet
        if (!collaboratorNames[realId]) {
          try {
            let targetUsername = c.username;
            if (!targetUsername && c.email) targetUsername = c.email.split('@')[0];
            if (!targetUsername && c.nameOrEmail && c.nameOrEmail.includes('@')) targetUsername = c.nameOrEmail.split('@')[0];

            if (targetUsername) {
              const profile = await profileService.getPublicProfile(targetUsername);
              if (profile.displayName) {
                newNames[realId] = profile.displayName;
              }
            }
          } catch (err) {
            // Low noise error
          }
        }
      });

      await Promise.all(promises);

      if (Object.keys(newNames).length > 0) {
        setCollaboratorNames(prev => ({ ...prev, ...newNames }));
      }
    };

    if (currentCollaborators.length > 0) {
      fetchProfiles();
    }
  }, [currentCollaborators]); // Removed dependency on collaboratorNames to avoid loop, simple check inside

  // Helper to generate avatar from email/name
  const getAvatar = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Helper to generate color (simple hash)
  const getColor = (name: string) => {
    const colors = ['#38BDF8', '#2DD4BF', '#2DD4BF', '#666', '#FBBF24', '#F472B6', '#4ADE80'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const handleInvite = async () => {
    if (!inviteInput || !projectId) {
      toast.error("Please enter an email");
      return;
    }

    try {
      setInviting(true);
      await collabApi.inviteCollaborator(projectId, inviteInput);
      toast.success(`Invite sent to ${inviteInput}`);
      await refreshCollaborators(projectId);
      setInviteInput('');
      setShowInvite(false);
    } catch (error: any) {
      console.error("Invite failed", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to send invite";
      toast.error(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-3 h-3 text-[#FBBF24]" />;
      case 'COLLABORATOR':
        return <Code className="w-3 h-3 text-[#94A3B8]" />;
      case 'VIEWER':
        return <Eye className="w-3 h-3 text-[#94A3B8]" />;
      default:
        return null;
    }
  };

  return (
    <div className="border-b border-white/5 bg-[#060910] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="text-xs font-semibold tracking-wide text-white/60 uppercase">COLLABORATORS</div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-white/10 rounded transition-colors" title="Invite user" onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Participants list */}
      <div className="p-2 space-y-1 overflow-y-auto flex-1">
        {(!Array.isArray(currentCollaborators) || currentCollaborators.length === 0) ? (
          <div className="text-center text-white/30 py-4 text-xs">No collaborators yet</div>
        ) : (

          currentCollaborators.map((participant) => {
            if (!participant) return null; // Safe guard

            // Resolve fields from potential backend variations
            const realId = participant.id || participant.userId || "unknown-id";

            // Robust name derivation
            const pAny = participant as any;
            // Check fetching cache first, then API fields
            const fetchedDisplayName = collaboratorNames[realId];

            let rawName = fetchedDisplayName || pAny.display_name || participant.displayName || pAny.full_name || participant.fullName || participant.name || participant.username || pAny.username;

            // If explicit name missing, fallback to nameOrEmail
            if (!rawName && participant.nameOrEmail) {
              if (!participant.nameOrEmail.includes('@')) {
                rawName = participant.nameOrEmail;
              } else {
                rawName = participant.nameOrEmail.split('@')[0];
              }
            }

            if (!rawName && participant.email) rawName = participant.email.split('@')[0];
            if (!rawName) rawName = "User";

            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

            // Display email fallback
            const displayEmail = participant.email || (participant.nameOrEmail && participant.nameOrEmail.includes('@') ? participant.nameOrEmail : "") || "User";
            const color = getColor(displayEmail);

            return (
              <div
                key={realId}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border text-xs"
                    style={{
                      backgroundColor: `${color}20`,
                      borderColor: color,
                      color: color,
                      fontWeight: '600'
                    }}
                  >
                    {getAvatar(displayEmail)}
                  </div>

                  {/* Status indicator - Mock for now unless linked to VoiceContext or OnlineStatusContext */}
                  <div
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#060910] bg-[#4ADE80]"
                  />
                </div>

                {/* Name and role */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate text-white/90">
                    {displayName}
                  </div>
                  {/* Show email as secondary if we derived the name or used a real name */}
                  <div className="text-xs truncate text-white/50">{displayEmail}</div>

                  <div className="flex items-center gap-1.5 text-[10px] text-white/60 uppercase mt-0.5">
                    {/* Only show Role label if NOT Collaborator (default) */}
                    {participant.role !== 'COLLABORATOR' && (
                      <>
                        {getRoleIcon(participant.role)}
                        <span>{participant.role}</span>
                      </>
                    )}
                    {/* Always show Pending status */}
                    {participant.status === 'PENDING' && <span className="text-[#F59E0B] font-medium tracking-wide">(Pending)</span>}
                  </div>
                </div>

                {/* Quick actions (admin only ideally) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-white/10 rounded text-xs text-white/50 hover:text-white transition-colors focus:outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-[#162032] border-white/10 text-white">
                      <DropdownMenuItem
                        className="text-[#9A3412] focus:text-[#9A3412] focus:bg-[#EF6461]/10 cursor-pointer text-xs"
                        onClick={async (e) => {
                          e.stopPropagation(); // prevent row click if needed
                          if (!confirm("Remove this user?")) return;
                          try {
                            await collabApi.removeCollaborator(projectId!, realId);
                            toast.success("User removed");
                            // Small delay to ensure DB commit propagates before refetching
                            setTimeout(() => {
                              refreshCollaborators(projectId!);
                            }, 100);
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || err.message || "Failed");
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>



      {showInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="bg-[#162032] rounded-xl shadow-2xl border border-white/10 p-8 w-[600px] relative" onClick={e => e.stopPropagation()}>

            {/* Header with Flexbox to prevent overlap */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Invite to Workspace</h2>
                <p className="text-white/40 text-sm">Add members to collaborate on this project.</p>
              </div>
              <button
                className="text-white/50 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                onClick={() => setShowInvite(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-[#162032] text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all placeholder:text-white/20"
                  placeholder="name@example.com"
                  value={inviteInput}
                  onChange={e => setInviteInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 relative z-50">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className={`relative p-3 rounded-xl border transition-all duration-200 text-left group overflow-hidden ${inviteRole === 'COLLABORATOR'
                      ? 'bg-[#38BDF8]/10 border-[#38BDF8] ring-1 ring-[#38BDF8] shadow-[0_0_20px_rgba(56, 189, 248,0.15)]'
                      : 'bg-[#162032] border-white/5 hover:border-white/10 hover:bg-[#162032]'
                      }`}
                    onClick={() => setInviteRole('COLLABORATOR')}
                  >
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className={`p-2 w-fit rounded-lg transition-colors ${inviteRole === 'COLLABORATOR' ? 'bg-[#38BDF8] text-white shadow-lg shadow-[#38BDF8]/25' : 'bg-white/5 text-white/40 group-hover:text-white/60'
                        }`}>
                        <Code className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`font-bold text-sm mb-0.5 ${inviteRole === 'COLLABORATOR' ? 'text-white' : 'text-white/70'}`}>Collaborator</div>
                        <div className={`text-[10px] leading-tight ${inviteRole === 'COLLABORATOR' ? 'text-[#CBD5E1]' : 'text-white/30'}`}>Edit, manage & deploy</div>
                      </div>
                    </div>
                  </button>

                  <button
                    className={`relative p-3 rounded-xl border transition-all duration-200 text-left group overflow-hidden ${inviteRole === 'VIEWER'
                      ? 'bg-[#38BDF8]/10 border-[#38BDF8] ring-1 ring-[#38BDF8] shadow-[0_0_20px_rgba(56, 189, 248,0.15)]'
                      : 'bg-[#162032] border-white/5 hover:border-white/10 hover:bg-[#162032]'
                      }`}
                    onClick={() => setInviteRole('VIEWER')}
                  >
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className={`p-2 w-fit rounded-lg transition-colors ${inviteRole === 'VIEWER' ? 'bg-[#38BDF8] text-white shadow-lg shadow-[#38BDF8]/25' : 'bg-white/5 text-white/40 group-hover:text-white/60'
                        }`}>
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`font-bold text-sm mb-0.5 ${inviteRole === 'VIEWER' ? 'text-white' : 'text-white/70'}`}>Viewer</div>
                        <div className={`text-[10px] leading-tight ${inviteRole === 'VIEWER' ? 'text-[#CBD5E1]' : 'text-white/30'}`}>Read-only access</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2 relative z-10">
                <button
                  disabled={isInviting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-xl hover:opacity-90 transition-all duration-300 text-sm font-bold text-white shadow-lg shadow-[#38BDF8]/25 disabled:opacity-50 disabled:shadow-none"
                  onClick={handleInvite}
                >
                  {isInviting ? "Sending Invitation..." : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}