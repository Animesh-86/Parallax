import { useState, useEffect } from 'react';
import { X, Folder, ChevronDown, Sparkles } from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // parent will handle saving + navigation
  onCreateProject: (projectName: string, language: string) => Promise<void> | void;
}

export function QuickCreateModal({
  isOpen,
  onClose,
  onCreateProject,
}: QuickCreateModalProps) {
  const [projectName, setProjectName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
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
  const languages = [
    { value: 'python', label: 'Python', color: '#3776AB' },
    { value: 'java', label: 'Java', color: '#007396' },
    { value: 'javascript', label: 'JavaScript', color: '#F7DF1E' },
    { value: 'c', label: 'C', color: '#A8B9CC' },
    { value: 'cpp', label: 'C++', color: '#00599C' },
    { value: 'none', label: 'Empty Project (No Template)', color: '#A1A1AA' },
  ];

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!projectName.trim() || !selectedLanguage || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await onCreateProject(projectName.trim(), selectedLanguage);

      // reset local state
      setProjectName('');
      setSelectedLanguage('');

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

            {/* Language dropdown */}
            <div className="space-y-2">
            {/* Language Selection Grid */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/70">
                Project Template (Initial Language)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {languages.map((lang) => {
                  const isSelected = selectedLanguage === lang.value;
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setSelectedLanguage(lang.value)}
                      className={`relative px-3 py-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-3 group ${
                        isSelected 
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div 
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'bg-[#D4AF37]/20' : 'bg-white/5'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: lang.color,
                            boxShadow: isSelected ? `0 0 10px ${lang.color}` : 'none',
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold tracking-wide uppercase transition-colors duration-300 ${
                        isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                      }`}>
                        {lang.label === 'Empty Project (No Template)' ? 'Empty' : lang.label}
                      </span>

                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-1.5 h-1.5 bg-black rounded-full" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

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
                disabled={!projectName.trim() || !selectedLanguage || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#A1A1AA] rounded-xl font-medium text-white hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <Sparkles className="w-4 h-4 relative z-10" />
                <span className="relative z-10">
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
