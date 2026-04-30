import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Terminal, Sparkles, Trash2, Users, Info, ChevronRight, Check, X, Type, Layout, Cpu, Globe } from 'lucide-react';
import { projectSettingsApi } from '../../services/projectSettingsApi';
import { collabApi, Collaborator } from '../../services/collabApi';

interface ProjectSettingsPanelProps {
  projectId: string;
  onUpdate?: () => void;
}

export function ProjectSettingsPanel({ projectId, onUpdate }: ProjectSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'editor' | 'environment' | 'collaborators' | 'danger'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState<any>({
    tabSize: 2,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
    minimap: true,
    wordWrap: 'on',
    autoSave: true,
    lineNumbers: 'on',
    theme: 'parallax-dark'
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [teamInfo, setTeamInfo] = useState<{ id?: string; name?: string }>({});
  const [runtimeName, setRuntimeName] = useState('Standard Sandbox');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const details = await projectSettingsApi.getProjectDetails(projectId);
      setName(details.name);
      setDescription(details.description || '');
      const parsedSettings = JSON.parse(details.settingsJson || '{}');
      setSettings((prev: any) => ({ ...prev, ...parsedSettings }));
      setTeamInfo({ id: details.teamId, name: details.teamName });
      setRuntimeName(details.runtimeName || 'Standard Sandbox');

      if (details.teamId) {
        const collabs = await collabApi.getProjectCollaborators(projectId);
        setCollaborators(collabs);
      }
    } catch (err) {
      setError('Failed to load project settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await projectSettingsApi.updateSettings(projectId, {
        name,
        description,
        settingsJson: JSON.stringify(settings)
      });
      setSuccess(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <div className="animate-spin mr-2"><Settings className="w-5 h-5" /></div>
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090B] text-white">
      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/20 overflow-x-auto no-scrollbar">
        {[
          { id: 'general', icon: Info, label: 'General' },
          { id: 'editor', icon: Type, label: 'Editor' },
          { id: 'environment', icon: Cpu, label: 'Runtime' },
          { id: 'collaborators', icon: Users, label: 'Team' },
          { id: 'danger', icon: Shield, label: 'Danger' }
        ].map((tab) => {
          if (tab.id === 'collaborators' && !teamInfo.id) return null;
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-white/5' 
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24">
        {activeTab === 'general' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Project Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                placeholder="My Awesome Project"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors min-h-[80px] resize-none"
                placeholder="Tell the world what you're building..."
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-start p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-left group">
                   <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3 h-3 text-[#D4AF37]" />
                      <span className="text-[11px] font-bold">Private</span>
                   </div>
                   <span className="text-[9px] text-white/40">Only you and invited collaborators.</span>
                </button>
                <button className="flex flex-col items-start p-3 bg-white/5 border border-white/10 rounded-lg text-left opacity-40 cursor-not-allowed">
                   <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-3 h-3" />
                      <span className="text-[11px] font-bold">Public</span>
                   </div>
                   <span className="text-[9px] text-white/40">Coming soon for everyone.</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Font Size</label>
                  <input 
                    type="number" 
                    value={settings.fontSize}
                    onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Tab Size</label>
                  <select 
                    value={settings.tabSize}
                    onChange={(e) => setSettings({...settings, tabSize: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                    <option value={8}>8 Spaces</option>
                  </select>
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Font Family</label>
                <select 
                  value={settings.fontFamily}
                  onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="'Fira Code', 'JetBrains Mono', monospace">Fira Code</option>
                  <option value="'Inter', sans-serif">Inter (UI Font)</option>
                  <option value="monospace">System Monospace</option>
                </select>
             </div>

             <div className="space-y-4 pt-2">
                <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Features</label>
                <div className="space-y-2">
                   {[
                     { key: 'minimap', label: 'Show Minimap', icon: Layout },
                     { key: 'autoSave', label: 'Auto Save Changes', icon: Save },
                   ].map((item) => (
                     <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                           <item.icon className="w-3.5 h-3.5 text-white/40" />
                           <span className="text-xs">{item.label}</span>
                        </div>
                        <button 
                          onClick={() => setSettings({...settings, [item.key]: !settings[item.key]})}
                          className={`w-8 h-4 rounded-full transition-colors relative ${settings[item.key] ? 'bg-[#D4AF37]' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings[item.key] ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                     </div>
                   ))}

                   <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                         <Type className="w-3.5 h-3.5 text-white/40" />
                         <span className="text-xs">Word Wrap</span>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, wordWrap: settings.wordWrap === 'on' ? 'off' : 'on'})}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.wordWrap === 'on' ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white/40'}`}
                      >
                        {settings.wordWrap === 'on' ? 'ENABLED' : 'DISABLED'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'environment' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Active Execution Layer</label>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-4 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{runtimeName}</div>
                      <div className="text-[10px] text-white/40">Running in Parallax-Sandbox-Asia-1</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                   <div className="p-2 bg-black/40 rounded border border-white/5">
                      <div className="text-[9px] text-white/20 uppercase font-bold mb-1">CPU Usage</div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[12%] animate-pulse" />
                      </div>
                   </div>
                   <div className="p-2 bg-black/40 rounded border border-white/5">
                      <div className="text-[9px] text-white/20 uppercase font-bold mb-1">Memory</div>
                      <div className="text-[10px] font-mono">124MB / 512MB</div>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg flex gap-3">
              <Sparkles className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#D4AF37]/80 leading-relaxed">
                <span className="font-bold">Project Environments:</span> You can soon define custom Dockerfiles for your project to have full control over the runtime environment.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-white/30">Active Members</label>
              <button className="text-[10px] text-[#D4AF37] font-bold hover:underline flex items-center gap-1">
                <Users className="w-3 h-3" />
                Manage Team
              </button>
            </div>
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div key={collab.userId} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#888] flex items-center justify-center text-[10px] font-bold text-black border border-white/10">
                      {collab.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{collab.userName}</div>
                      <div className="text-[9px] text-white/30">{collab.role} • Joined 2 days ago</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-[#D4AF37] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-red-500 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Danger Zone
              </h4>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Be extremely careful. Deleting this project will permanently remove all associated code, history, and collaborations. This cannot be undone.
              </p>
              
              <div className="space-y-2">
                 <button className="w-full py-2.5 bg-red-500/10 border border-red-500/20 rounded-md text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Trash2 className="w-3 h-3" />
                    DELETE THIS PROJECT
                 </button>
                 <button className="w-full py-2.5 bg-white/5 border border-white/10 rounded-md text-[11px] font-bold text-white/40 hover:text-white/80 transition-all flex items-center justify-center gap-2">
                    ARCHIVE PROJECT
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Save Button - Floating Style */}
      {activeTab !== 'danger' && activeTab !== 'collaborators' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#09090B] via-[#09090B] to-transparent">
          <div className="p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-between shadow-2xl">
            <div className="flex flex-col">
              {error && <span className="text-[10px] text-red-500 font-bold">{error}</span>}
              {success && <span className="text-[10px] text-[#D4AF37] font-bold flex items-center gap-1 animate-bounce"><Check className="w-3 h-3" /> SAVED!</span>}
              {!error && !success && (
                <>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Draft Changes</span>
                  <span className="text-[9px] text-white/20">Pending sync...</span>
                </>
              )}
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2.5 rounded-lg bg-[#D4AF37] text-black text-[11px] font-bold shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 transition-all active:scale-95 hover:shadow-[#D4AF37]/40 ${saving ? 'opacity-50' : ''}`}
            >
              {saving ? (
                <div className="animate-spin w-3 h-3 border-2 border-black/30 border-t-black rounded-full" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  SAVE SETTINGS
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
