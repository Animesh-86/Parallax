import { useState, useEffect } from 'react';
import { GitCommit, GitBranch, GitMerge, Clock, User, ChevronDown, Plus, Loader, AlertCircle, Check, X, PlayCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { versioningApi, ProjectCommit, ProjectBranch, MergeRequestData } from '../../services/versioningApi';
import { CreatePullRequestModal } from './CreatePullRequestModal';
import { toast } from 'sonner';

interface ActivityPanelProps {
  projectId: string;
  activeBranchId: string | null;
  onBranchChange: (branch: ProjectBranch) => void;
  githubRepoUrl?: string;
  onRemoteAdded?: () => void;
}

export function ActivityPanel({ projectId, activeBranchId, onBranchChange, githubRepoUrl, onRemoteAdded }: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<'commits' | 'branches' | 'merge-requests'>('commits');
  const [commits, setCommits] = useState<ProjectCommit[]>([]);
  const [branches, setBranches] = useState<ProjectBranch[]>([]);
  const [mergeRequests, setMergeRequests] = useState<MergeRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [remoteUrlInput, setRemoteUrlInput] = useState('');
  const [settingRemote, setSettingRemote] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commitsData, branchesData, mrData] = await Promise.all([
        activeBranchId 
          ? versioningApi.getCommits(projectId, activeBranchId)
          : versioningApi.getCommits(projectId),
        versioningApi.getBranches(projectId),
        versioningApi.getMergeRequests(projectId),
      ]);
      setCommits(commitsData);
      setBranches(branchesData);
      setMergeRequests(mrData);
    } catch (err) {
      console.error('Failed to load versioning data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim() || !activeBranchId || submitting) return;
    try {
      setSubmitting(true);
      await versioningApi.createCommit(projectId, activeBranchId, commitMessage.trim());
      setCommitMessage('');
      loadData();
    } catch (err) {
      console.error('Failed to create commit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePush = async () => {
    if (!activeBranchId || submitting) return;
    try {
      setSubmitting(true);
      await versioningApi.pushBranch(projectId, activeBranchId);
      toast.success('Successfully pushed to GitHub');
    } catch (err: any) {
      console.error('Failed to push:', err);
      toast.error('Failed to push: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRemote = async () => {
    if (!remoteUrlInput.trim() || settingRemote) return;
    try {
      setSettingRemote(true);
      await versioningApi.addRemote(projectId, remoteUrlInput.trim());
      toast.success('Remote configured successfully');
      setRemoteUrlInput('');
      if (onRemoteAdded) onRemoteAdded();
    } catch (err: any) {
      console.error('Failed to set remote:', err);
      toast.error('Failed to set remote: ' + (err.response?.data?.error || err.message));
    } finally {
      setSettingRemote(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || submitting) return;
    try {
      setSubmitting(true);
      const branch = await versioningApi.createBranch(projectId, newBranchName.trim());
      setNewBranchName('');
      setShowNewBranch(false);
      setBranches(prev => [branch, ...prev]);
      onBranchChange(branch);
    } catch (err) {
      console.error('Failed to create branch:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMergeRequestAction = async (mrId: string, status: 'MERGED' | 'REJECTED' | 'CLOSED') => {
    try {
      await versioningApi.updateMergeRequestStatus(projectId, mrId, status);
      loadData();
    } catch (err) {
      console.error('Failed to update merge request:', err);
    }
  };

  const handleDeleteBranch = async (branchId: string, branchName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast(`Are you sure you want to delete branch '${branchName}'?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await versioningApi.deleteBranch(projectId, branchName);
            loadData();
            toast.success(`Branch ${branchName} deleted`);
          } catch (err) {
            toast.error('Failed to delete branch. Ensure it is not the main branch and you do not have it checked out.');
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? (ts > 1e11 ? ts : ts * 1000) : ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return 'text-[#4ADE80] bg-[#4ADE80]/10 border-[#4ADE80]/30';
      case 'MERGED': return 'text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/30';
      case 'REJECTED': return 'text-[#EF6461] bg-[#EF6461]/10 border-[#EF6461]/30';
      case 'CLOSED': return 'text-white/40 bg-white/5 border-white/10';
      case 'APPROVED': return 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-5 h-5 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="bg-[#09090B] border border-white/5 rounded-2xl overflow-hidden">
      {/* Current Branch Banner */}
      <div className="px-4 py-3 bg-[#D4AF37]/5 border-b border-[#D4AF37]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Current Branch</span>
        </div>
        <span className="text-sm font-mono font-bold text-[#D4AF37]">
          {activeBranchId ? branches.find(b => b.id === activeBranchId)?.name || '...' : '...'}
        </span>
      </div>

      {/* Tab Dropdown */}
      <div className="relative p-2 border-b border-white/5">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-3 py-2 text-sm font-medium flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
        >
          <div className="flex items-center gap-2">
            {activeTab === 'commits' && <GitCommit className="w-4 h-4 text-[#D4AF37]" />}
            {activeTab === 'branches' && <GitBranch className="w-4 h-4 text-[#D4AF37]" />}
            {activeTab === 'merge-requests' && <GitMerge className="w-4 h-4 text-[#D4AF37]" />}
            <span>
              {activeTab === 'commits' ? 'Commits' : activeTab === 'branches' ? 'Branches' : 'Pull Requests'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-2 right-2 mt-1 bg-[#09090B] border border-white/10 rounded-lg overflow-hidden shadow-2xl z-50 py-1"
              >
                {[
                  { id: 'commits' as const, label: 'Commits', icon: GitCommit, count: commits.length },
                  { id: 'branches' as const, label: 'Branches', icon: GitBranch, count: branches.length },
                  { id: 'merge-requests' as const, label: 'Pull Requests', icon: GitMerge, count: mergeRequests.filter(m => m.status === 'OPEN').length },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${
                        activeTab === tab.id ? 'text-[#D4AF37] bg-white/5' : 'text-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </div>
                      {tab.count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{tab.count}</span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Commits Tab */}
      {activeTab === 'commits' && (
        <div>
          {/* Quick Commit */}
          {activeBranchId && (
            <div className="p-4 border-b border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                  placeholder="Commit message..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#D4AF37]/50"
                />
                <button
                  onClick={handleCommit}
                  disabled={!commitMessage.trim() || submitting}
                  className="px-4 py-2 bg-[#D4AF37] rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-[#D4AF37]/90 transition-colors"
                >
                  Commit
                </button>
                {githubRepoUrl && (
                  <button
                    onClick={handlePush}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-medium text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    Push
                  </button>
                )}
              </div>
            </div>
          )}

          {!githubRepoUrl && (
            <div className="p-4 border-b border-white/5 bg-[#09090B]/50">
              <p className="text-xs text-white/50 mb-2">Connect to a GitHub repository to push your branches.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={remoteUrlInput}
                  onChange={(e) => setRemoteUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRemote()}
                  placeholder="https://github.com/username/repo"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#D4AF37]/50"
                />
                <button
                  onClick={handleAddRemote}
                  disabled={!remoteUrlInput.trim() || settingRemote}
                  className="px-4 py-2 bg-white/10 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-white/20 transition-colors"
                >
                  Add Remote
                </button>
              </div>
            </div>
          )}

          {/* Commit List */}
          <div className="max-h-[400px] overflow-y-auto">
            {commits.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-sm">
                <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No commits yet. Save your first snapshot!
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {commits.map((commit, i) => (
                  <motion.div
                    key={commit.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{commit.message}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {commit.authorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {commit.branchName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(commit.committedAt)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/20 font-mono mt-1">{commit.id.slice(0, 7)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div>
          <div className="p-4 border-b border-white/5">
            {showNewBranch ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                  placeholder="Branch name..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-[#D4AF37]/50"
                  autoFocus
                />
                <button onClick={handleCreateBranch} disabled={submitting} className="px-3 py-2 bg-[#D4AF37] rounded-lg text-xs font-medium disabled:opacity-50">
                  Create
                </button>
                <button onClick={() => { setShowNewBranch(false); setNewBranchName(''); }} className="px-3 py-2 bg-white/5 rounded-lg text-xs">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewBranch(true)}
                className="w-full px-3 py-2 bg-white/5 border border-dashed border-white/10 rounded-lg text-xs text-white/50 hover:text-white/80 hover:border-[#D4AF37]/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                New Branch
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {branches.map((branch) => (
              <div key={branch.id} className={`flex items-center w-full transition-colors ${activeBranchId === branch.id ? 'bg-[#D4AF37]/5' : ''}`}>
                <button
                  onClick={() => onBranchChange(branch)}
                  className="flex-1 min-w-0 text-left px-4 py-3 hover:bg-white/[0.02] transition-colors flex items-center gap-3"
                >
                  <GitBranch className={`w-4 h-4 shrink-0 ${branch.isMain ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {branch.name}
                      {branch.isMain && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">default</span>}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">by {branch.createdByName} · {formatTime(branch.createdAt)}</p>
                  </div>
                  {activeBranchId === branch.id && (
                    <div className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                  )}
                </button>
                {!branch.isMain && (
                  <button 
                    onClick={(e) => handleDeleteBranch(branch.id, branch.name, e)}
                    className="p-3 text-white/30 hover:text-red-400 transition-colors"
                    title="Delete branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Requests Tab */}
      {activeTab === 'merge-requests' && (
        <div className="flex flex-col h-full">
          {/* Create PR Button (GitHub) */}
          {githubRepoUrl && (
            <div className="p-4 border-b border-white/5">
              <button
                onClick={() => setIsPrModalOpen(true)}
                className="w-full px-3 py-2 bg-white/5 border border-dashed border-white/10 rounded-lg text-xs text-white/50 hover:text-white/80 hover:border-[#D4AF37]/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Create GitHub Pull Request
              </button>
            </div>
          )}

          <div className="flex-1 max-h-[400px] overflow-y-auto">
          {mergeRequests.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">
              <GitMerge className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No merge requests yet
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {mergeRequests.map((mr) => (
                <div key={mr.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{mr.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                        <span>{mr.authorName}</span>
                        <span>·</span>
                        <span className="font-mono text-[#D4AF37]">{mr.sourceBranchName}</span>
                        <span>→</span>
                        <span className="font-mono">{mr.targetBranchName}</span>
                      </div>
                      {mr.description && (
                        <p className="text-xs text-white/30 mt-1 line-clamp-2">{mr.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(mr.status)}`}>
                        {mr.status}
                      </span>
                    </div>
                  </div>
                  {mr.status === 'OPEN' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleMergeRequestAction(mr.id, 'MERGED')}
                        className="px-3 py-1 bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-lg text-[10px] text-[#4ADE80] hover:bg-[#4ADE80]/20 transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Merge
                      </button>
                      <button
                        onClick={() => handleMergeRequestAction(mr.id, 'REJECTED')}
                        className="px-3 py-1 bg-[#EF6461]/10 border border-[#EF6461]/30 rounded-lg text-[10px] text-[#EF6461] hover:bg-[#EF6461]/20 transition-all flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {isPrModalOpen && (
        <CreatePullRequestModal
          projectId={projectId}
          onClose={() => setIsPrModalOpen(false)}
          onSuccess={() => {
            setIsPrModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
