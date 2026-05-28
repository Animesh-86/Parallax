import { useState, useEffect } from 'react';
import { teamApi } from '../../services/teamApi';
import { FileText, Plus, Save, Trash2, Edit2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Note {
  id: string;
  title: string;
  content: string;
  visibility: 'TEAM' | 'PRIVATE' | 'ADMIN_ONLY';
  createdByName: string;
  lastEditedBy: string;
  updatedAt: string;
}

export function TeamNotes({ teamId, myName }: { teamId: string, myName: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editVisibility, setEditVisibility] = useState<'TEAM' | 'PRIVATE' | 'ADMIN_ONLY'>('TEAM');
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      const data = await teamApi.getNotes(teamId);
      setNotes(data);
      if (data.length > 0 && !activeNote) setActiveNote(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [teamId]);

  const handleCreate = async () => {
    try {
      const created = await teamApi.createNote(teamId, { title: 'Untitled Note', content: '', visibility: 'TEAM', createdByName: myName });
      setNotes([created, ...notes]);
      setActiveNote(created);
      setEditTitle(created.title);
      setEditContent(created.content);
      setEditVisibility('TEAM');
      setIsEditing(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!activeNote) return;
    try {
      const updated = await teamApi.updateNote(teamId, activeNote.id, {
        title: editTitle,
        content: editContent,
        visibility: editVisibility,
        editedByName: myName,
      });
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      setActiveNote(updated);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    try {
      await teamApi.deleteNote(teamId, activeNote.id);
      setNotes(prev => prev.filter(n => n.id !== activeNote.id));
      setActiveNote(notes.filter(n => n.id !== activeNote.id)[0] || null);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[70vh] bg-[#09090B] border border-white/5 rounded-2xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notes</h3>
          <button onClick={handleCreate} className="p-1 hover:bg-white/10 rounded">
            <Plus className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => {
                setActiveNote(note);
                setIsEditing(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeNote?.id === note.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="truncate font-medium flex-1 mr-2">{note.title}</div>
                <div className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                    note.visibility === 'PRIVATE' ? 'bg-[#EF6461]/20 text-[#EF6461]' : 
                    note.visibility === 'ADMIN_ONLY' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 
                    'bg-white/10 text-white/60'
                }`}>
                    {note.visibility === 'PRIVATE' ? 'Private' : note.visibility === 'ADMIN_ONLY' ? 'Admin' : 'Team'}
                </div>
              </div>
              <div className="text-[10px] opacity-60 mt-1">{new Date(note.updatedAt).toLocaleDateString()}</div>
            </button>
          ))}
          {notes.length === 0 && !loading && (
            <div className="text-center text-xs text-white/40 mt-4">No notes yet</div>
          )}
        </div>
      </div>

      {/* Editor / Viewer */}
      <div className="flex-1 flex flex-col relative bg-[#09090B]">
        {activeNote ? (
          <>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              {isEditing ? (
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="bg-transparent text-xl font-semibold focus:outline-none w-full border-b border-[#D4AF37]/50"
                    placeholder="Note Title"
                  />
                  <select 
                    value={editVisibility}
                    onChange={e => setEditVisibility(e.target.value as any)}
                    className="bg-[#121214] border border-white/10 rounded px-2 py-1 text-xs text-white/80 focus:outline-none w-32"
                  >
                    <option value="TEAM">Team (All)</option>
                    <option value="ADMIN_ONLY">Admin Only</option>
                    <option value="PRIVATE">Private (Only me)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{activeNote.title}</h2>
                    <div className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        activeNote.visibility === 'PRIVATE' ? 'bg-[#EF6461]/20 text-[#EF6461] border border-[#EF6461]/30' : 
                        activeNote.visibility === 'ADMIN_ONLY' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' : 
                        'bg-white/10 text-white/60 border border-white/10'
                    }`}>
                        {activeNote.visibility === 'PRIVATE' ? 'Private Note' : activeNote.visibility === 'ADMIN_ONLY' ? 'Admin Only' : 'Team Note'}
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Last edited by {activeNote.lastEditedBy}</p>
                </div>
              )}
              <div className="flex items-center gap-2 ml-4">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37] text-black text-xs font-semibold rounded-lg hover:bg-[#D4AF37]/90 transition-colors">
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/60 text-xs font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setEditTitle(activeNote.title);
                        setEditContent(activeNote.content);
                        setEditVisibility(activeNote.visibility);
                        setIsEditing(true);
                      }} 
                      className="p-2 text-white/60 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleDelete} className="p-2 text-white/60 hover:bg-[#EF6461]/10 hover:text-[#EF6461] rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full h-full bg-transparent resize-none focus:outline-none text-sm text-white/80 font-mono"
                  placeholder="Write your note using Markdown..."
                />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeNote.content || '*Empty note*'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p>Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
