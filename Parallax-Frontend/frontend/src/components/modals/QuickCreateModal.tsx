// QuickCreateModal.tsx
import { useState } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languages = [
    { value: 'python', label: 'Python', color: '#64748B' },
  ];

  if (!isOpen) return null;

  const selectedLangObj = languages.find((l) => l.value === selectedLanguage);

  const handleSelectLanguage = (value: string) => {
    setSelectedLanguage(value);
    setIsDropdownOpen(false);
  };

  const handleCreate = async () => {
    if (!projectName.trim() || !selectedLanguage || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await onCreateProject(projectName.trim(), selectedLanguage);

      // reset local state
      setProjectName('');
      setSelectedLanguage('');
      setIsDropdownOpen(false);

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
        <div className="relative bg-[#060910]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#38BDF8]/20 to-[#94A3B8]/20 border border-[#38BDF8]/30 flex items-center justify-center">
                      <Folder className="w-6 h-6 text-[#38BDF8]" />
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#38BDF8]/50 focus:bg-white/[0.07] transition-all font-mono"
                autoFocus
              />
            </div>

            {/* Language dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
                Programming Language
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className="w-full px-4 py-3 bg:white/5 bg-white/5 border border-white/10 rounded-xl text-left flex items-center justify-between hover:bg-white/[0.07] hover:border-white/20 transition-all"
                >
                  <span className={selectedLanguage ? 'text-white' : 'text-white/30'}>
                    {selectedLangObj ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: selectedLangObj.color,
                            boxShadow: `0 0 10px ${selectedLangObj.color}60`,
                          }}
                        />
                        {selectedLangObj.label}
                      </span>
                    ) : (
                      'Select a language'
                    )}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#060910]/95 border border-white/10 rounded-xl shadow-2xl z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.value)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3"
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: lang.color,
                            boxShadow: `0 0 10px ${lang.color}60`,
                          }}
                        />
                        <span className="text-white/90">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#38BDF8] to-[#94A3B8] rounded-xl font-medium text-white hover:shadow-xl hover:shadow-[#38BDF8]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
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
