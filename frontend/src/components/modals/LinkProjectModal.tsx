import { useState, useEffect, useMemo } from 'react';
import { X, Search, Link2, Folder, Loader, Code2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { teamApi, TeamProject } from '../../services/teamApi';
import { apiBaseUrl } from '../../services/env';

interface LinkProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  existingProjectIds: string[];
  onLinked: () => void;
}

interface UserProject {
  id: string;
  name: string;
  language: string;
  teamId?: string | null;
  teamName?: string | null;
}

export function LinkProjectModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  existingProjectIds,
  onLinked,
}: LinkProjectModalProps) {
  const [allProjects, setAllProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchUserProjects();
  }, [isOpen]);

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${apiBaseUrl}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data: UserProject[] = await res.json();
      setAllProjects(data);
    } catch (err) {
      console.error('Failed to fetch user projects:', err);
      setError('Could not load your projects');
    } finally {
      setLoading(false);
    }
  };

  // Only show projects not already linked to ANY team
  const availableProjects = useMemo(() => {
    const existingSet = new Set(existingProjectIds);
    return allProjects.filter(
      (p) => !p.teamId && !existingSet.has(p.id) && !linked.has(p.id)
    );
  }, [allProjects, existingProjectIds, linked]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return availableProjects;
    const q = search.toLowerCase();
    return availableProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.language.toLowerCase().includes(q)
    );
  }, [availableProjects, search]);

  const handleLink = async (projectId: string) => {
    try {
      setLinking(projectId);
      setError(null);
      await teamApi.linkProjectToTeam(projectId, teamId);
      setLinked((prev) => new Set(prev).add(projectId));
      onLinked();
    } catch (err) {
      console.error('Failed to link project:', err);
      setError('Failed to link project');
    } finally {
      setLinking(null);
    }
  };

  const handleClose = () => {
    setSearch('');
    setLinked(new Set());
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg bg-[#0C0C0E] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#D4AF37]/20">
                  <Link2 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Link Existing Project</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    Add a personal project to <span className="text-[#D4AF37]">{teamName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your projects..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Project List */}
          <div className="px-6 py-4 max-h-[380px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-[#D4AF37]" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">
                  {search.trim()
                    ? 'No matching projects found'
                    : availableProjects.length === 0
                    ? 'All your projects are already linked to a team'
                    : 'No unlinked projects available'}
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const isLinking = linking === project.id;
                const isLinked = linked.has(project.id);

                return (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLinked
                        ? 'bg-[#4ADE80]/10 border-[#4ADE80]/20'
                        : 'bg-white/[0.02] border-white/5 hover:border-[#D4AF37]/30 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isLinked
                            ? 'bg-[#4ADE80]/20'
                            : 'bg-white/5'
                        }`}
                      >
                        {isLinked ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                        ) : (
                          <Code2 className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs text-white/40 font-mono">{project.language}</p>
                      </div>
                    </div>

                    {isLinked ? (
                      <span className="text-xs text-[#4ADE80] font-medium shrink-0">Linked ✓</span>
                    ) : (
                      <button
                        onClick={() => handleLink(project.id)}
                        disabled={isLinking}
                        className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                      >
                        {isLinking ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <Link2 className="w-3 h-3" />
                        )}
                        Link
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {linked.size > 0 && (
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-sm text-white/50">
                <span className="text-[#4ADE80] font-medium">{linked.size}</span> project{linked.size !== 1 ? 's' : ''} linked
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-[#D4AF37] rounded-lg text-sm font-medium hover:bg-[#D4AF37]/90 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
