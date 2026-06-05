import { useEffect, useState } from "react";
import axios from "axios";
import { Settings, Check, X, Save } from "lucide-react";
import { apiBaseUrl } from "../../services/env";

interface IdeSettings {
  enableAiAutocomplete: boolean;
  enableAiChat: boolean;
}

const defaultSettings: IdeSettings = {
  enableAiAutocomplete: true,
  enableAiChat: true,
};

import api from "../../services/api";

export function IdeSettingsPanel({ onClose, onSettingsChange }: { onClose: () => void, onSettingsChange: (s: any) => void }) {
  const [settings, setSettings] = useState<IdeSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/profiles/me")
      .then((res) => {
        if (res.data.ideSettings) {
          try {
            setSettings(JSON.parse(res.data.ideSettings));
            onSettingsChange(JSON.parse(res.data.ideSettings));
          } catch (e) {
            console.error("Failed to parse ide settings");
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/profiles/me/settings", {
        ideSettings: JSON.stringify(settings),
      });
      onSettingsChange(settings);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-white/50 text-sm">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#09090B] border-l border-white/10 text-white w-80">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2 font-medium">
          <Settings className="w-4 h-4 text-[#D4AF37]" />
          IDE Settings
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-2">AI Features</h3>
          
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Inline Autocomplete</span>
              <span className="text-xs text-white/40">Show AI ghost text while typing</span>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableAiAutocomplete ? 'bg-[#D4AF37]' : 'bg-white/10'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.enableAiAutocomplete ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            {/* hidden checkbox */}
            <input 
              type="checkbox" 
              className="hidden" 
              checked={settings.enableAiAutocomplete}
              onChange={(e) => setSettings({...settings, enableAiAutocomplete: e.target.checked})}
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col">
              <span className="text-sm font-medium">AI Chat Panel</span>
              <span className="text-xs text-white/40">Enable the AI assistant sidebar</span>
            </div>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${settings.enableAiChat ? 'bg-[#D4AF37]' : 'bg-white/10'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${settings.enableAiChat ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={settings.enableAiChat}
              onChange={(e) => setSettings({...settings, enableAiChat: e.target.checked})}
            />
          </label>
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-medium rounded hover:bg-[#D4AF37]/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
