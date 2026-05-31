import { useState, useEffect } from 'react';
import { X, Folder, ChevronDown, Plus } from 'lucide-react';
import GlobalLoader from '../GlobalLoader';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // parent will handle saving + navigation
  onCreateProject: (projectName: string, language: string, githubRepoUrl?: string, aiReviewEnabled?: boolean) => Promise<void> | void;
}

export function QuickCreateModal({
  isOpen,
  onClose,
  onCreateProject,
}: QuickCreateModalProps) {
  const [projectName, setProjectName] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);


  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!projectName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await onCreateProject(projectName.trim(), 'none', githubRepoUrl.trim(), true);

      // reset local state
      setProjectName('');
      setGithubRepoUrl('');

      onClose();
    } catch (err) {
      console.error('Modal: error from onCreateProject', err);
      setError('Failed to create project. Open console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = () => {
    if (!isSubmitting) onClose();
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
          {isSubmitting ? (
             <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
               <GlobalLoader fullScreen={false} />
               <p className="mt-8 text-white/70 font-mono animate-pulse">
                  {githubRepoUrl.trim() ? "Cloning repository from GitHub..." : "Initializing workspace..."}
               </p>
             </div>
          ) : (
            <>
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 border border-[#D4AF37]/30 flex items-center justify-center">
                      <Folder className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                      Create New Project
                    </h2>
                    <p className="text-sm text-white/40 mt-1">
                      Start your cosmic coding journey
                    </p>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all group"
              >
                <X className="w-5 h-5 text-white/60 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-6 space-y-6">
            {/* Project name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-project"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.07] transition-all font-mono"
                autoFocus
              />
            </div>



            {/* GitHub Repo URL (Optional) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
                GitHub Repository URL (Optional)
              </label>
              <input
                type="text"
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.07] transition-all font-mono"
              />
            </div>



            {error && (
              <p className="text-xs text-[#9A3412]">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!projectName.trim() || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-xl font-medium text-black hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </span>
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
