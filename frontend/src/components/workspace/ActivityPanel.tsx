import { useState, useEffect } from 'react';
import { GitCommit, GitBranch, GitMerge, Clock, User, ChevronDown, Plus, Loader, AlertCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { versioningApi, ProjectCommit, ProjectBranch, MergeRequestData } from '../../services/versioningApi';

interface ActivityPanelProps {
  projectId: string;
  activeBranchId: string | null;
  onBranchChange: (branch: ProjectBranch) => void;
}

export function ActivityPanel({ projectId, activeBranchId, onBranchChange }: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<'commits' | 'branches' | 'merge-requests'>('commits');
  const [commits, setCommits] = useState<ProjectCommit[]>([]);
  const [branches, setBranches] = useState<ProjectBranch[]>([]);
  const [mergeRequests, setMergeRequests] = useState<MergeRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commitsData, branchesData, mrData] = await Promise.all([
        versioningApi.getCommits(projectId),
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

  const handleCreateBranch = async () => {
    if (!newBranchName.trim() || submitting) return;
    try {
      setSubmitting(true);
      const branch = await versioningApi.createBranch(projectId, newBranchName.trim());
      setNewBranchName('');
      setShowNewBranch(false);
      setBranches(prev => [branch, ...prev]);
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

  const formatTime = (ts: string) => {
    const d = new Date(ts);
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
      {/* Tab Bar */}
      <div className="flex border-b border-white/5">
        {[
          { id: 'commits' as const, label: 'Commits', icon: GitCommit, count: commits.length },
          { id: 'branches' as const, label: 'Branches', icon: GitBranch, count: branches.length },
          { id: 'merge-requests' as const, label: 'Merge Requests', icon: GitMerge, count: mergeRequests.filter(m => m.status === 'OPEN').length },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{tab.count}</span>
              )}
            </button>
          );
        })}
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
              <button
                key={branch.id}
                onClick={() => onBranchChange(branch)}
                className={`w-full px-4 py-3 text-left hover:bg-white/[0.02] transition-colors flex items-center gap-3 ${
                  activeBranchId === branch.id ? 'bg-[#D4AF37]/5' : ''
                }`}
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
            ))}
          </div>
        </div>
      )}

      {/* Merge Requests Tab */}
      {activeTab === 'merge-requests' && (
        <div className="max-h-[400px] overflow-y-auto">
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
      )}
    </div>
  );
}
