import { useState, useEffect } from 'react';
import { teamApi, TeamMember } from '../../services/teamApi';
import { Plus, GripVertical, User, Trash2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeId?: string;
  assigneeName?: string;
  createdByName: string;
  createdAt: string;
}

export function TeamKanbanBoard({ teamId, members, myName }: { teamId: string, members: TeamMember[], myName: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null); // column id

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'bg-white/5 border-white/10' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-[#D4AF37]/10 border-[#D4AF37]/30' },
    { id: 'DONE', title: 'Done', color: 'bg-[#4ADE80]/10 border-[#4ADE80]/30' },
  ];

  const fetchTasks = async () => {
    try {
      const data = await teamApi.getTasks(teamId);
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [teamId]);

  const handleCreateTask = async (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!newTaskTitle.trim()) return;
    try {
      const created = await teamApi.createTask(teamId, {
        title: newTaskTitle,
        createdByName: myName,
      });
      // Immediately patch status if not TODO
      if (status !== 'TODO') {
        const updated = await teamApi.updateTask(teamId, created.id, { status });
        setTasks([...tasks, updated]);
      } else {
        setTasks([...tasks, created]);
      }
      setNewTaskTitle('');
      setIsAddingTask(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
      await teamApi.updateTask(teamId, taskId, { status: newStatus });
    } catch (e) {
      console.error(e);
      fetchTasks(); // revert
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await teamApi.deleteTask(teamId, taskId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async (taskId: string, memberId: string) => {
    try {
      const member = members.find(m => m.userId === memberId);
      if (!member) {
        // unassign
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigneeId: undefined, assigneeName: undefined } : t));
        await teamApi.updateTask(teamId, taskId, { assigneeId: null, assigneeName: null });
        return;
      }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigneeId: memberId, assigneeName: member.fullName } : t));
      await teamApi.updateTask(teamId, taskId, { assigneeId: memberId, assigneeName: member.fullName });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex gap-4 h-[70vh] overflow-x-auto overflow-y-hidden">
      {columns.map(col => (
        <div key={col.id} className={`flex-1 min-w-[300px] flex flex-col rounded-2xl border ${col.color}`}>
          <div className="p-4 border-b border-white/5 font-semibold flex items-center justify-between">
            {col.title}
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>
          <div 
            className="flex-1 p-4 overflow-y-auto space-y-3"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('taskId');
              if (taskId) handleUpdateStatus(taskId, col.id);
            }}
          >
            {tasks.filter(t => t.status === col.id).map(task => (
              <div 
                key={task.id} 
                draggable 
                onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                className="bg-[#09090B] border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-[#D4AF37]/50 transition-colors group relative"
              >
                <div className="flex items-start gap-2 mb-3">
                  <GripVertical className="w-4 h-4 text-white/20 mt-1 shrink-0 group-hover:text-white/40" />
                  <p className="text-sm flex-1 leading-snug">{task.title}</p>
                  <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-[#EF6461] transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <select
                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/60 focus:outline-none focus:border-[#D4AF37]/50"
                    value={task.assigneeId || ''}
                    onChange={(e) => handleAssign(task.id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>{m.fullName}</option>
                    ))}
                  </select>
                  {task.assigneeName && (
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]" title={task.assigneeName}>
                      {task.assigneeName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                  )}
                  {!task.assigneeName && (
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isAddingTask === col.id ? (
              <div className="bg-[#09090B] border border-[#D4AF37]/50 rounded-xl p-3">
                <input 
                  autoFocus
                  type="text" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-transparent text-sm focus:outline-none mb-3"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateTask(col.id as any);
                    if (e.key === 'Escape') setIsAddingTask(null);
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={() => handleCreateTask(col.id as any)} className="px-3 py-1 bg-[#D4AF37] text-black text-xs font-semibold rounded">Save</button>
                  <button onClick={() => setIsAddingTask(null)} className="px-3 py-1 text-white/60 hover:text-white text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => { setIsAddingTask(col.id); setNewTaskTitle(''); }}
                className="w-full py-2 flex items-center justify-center gap-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
