import { useState } from 'react';
import { User, Task, Project, TaskStatus, TaskPriority } from '../types';

interface Props {
  currentUser: User;
  tasks: Task[];
  projects: Project[];
  allUsers: User[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
}

export default function TasksPage({ currentUser, tasks, projects, allUsers, onUpdateTask, onDeleteTask, getUserById, getProjectById }: Props) {
  const [filterStatus, setFilterStatus] = useState<'All' | TaskStatus>('All');
  const [filterPriority, setFilterPriority] = useState<'All' | TaskPriority>('All');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'createdAt'>('dueDate');

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'All' && task.status !== filterStatus) return false;
    if (filterPriority !== 'All' && task.priority !== filterPriority) return false;
    if (filterProject !== 'all' && task.projectId !== filterProject) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'priority') {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.priority] - order[b.priority];
    }
    if (sortBy === 'status') {
      const order = { 'Todo': 0, 'In Progress': 1, 'Done': 2 };
      return order[a.status] - order[b.status];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-red-600 bg-red-50' };
    if (days === 0) return { label: 'Due today', color: 'text-orange-600 bg-orange-50' };
    if (days === 1) return { label: 'Tomorrow', color: 'text-yellow-600 bg-yellow-50' };
    return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-500 bg-gray-50' };
  };

  const statusColors: Record<TaskStatus, string> = {
    'Todo': 'bg-slate-100 text-slate-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    'Done': 'bg-green-100 text-green-700',
  };

  const priorityColors: Record<TaskPriority, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentUser.role === 'Admin' ? 'All Tasks' : 'My Tasks'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-48"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'All' | TaskStatus)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Status</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as 'All' | TaskPriority)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
            <option value="createdAt">Sort: Created</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const project = getProjectById(task.projectId);
            const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;
            const creator = getUserById(task.createdById);
            const due = formatDueDate(task.dueDate);
            const isEditing = editingTask?.id === task.id;

            return (
              <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {isEditing ? (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editingTask.title}
                        onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 col-span-full"
                      />
                      <textarea
                        value={editingTask.description}
                        onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                        rows={2}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 col-span-full resize-none"
                      />
                      <select
                        value={editingTask.status}
                        onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                      >
                        <option>Todo</option>
                        <option>In Progress</option>
                        <option>Done</option>
                      </select>
                      <select
                        value={editingTask.priority}
                        onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                      <select
                        value={editingTask.assigneeId || ''}
                        onChange={e => setEditingTask({ ...editingTask, assigneeId: e.target.value || null })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none"
                      >
                        <option value="">Unassigned</option>
                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                      <input
                        type="date"
                        value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                        onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value || null })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { onUpdateTask(task.id, { title: editingTask.title, description: editingTask.description, status: editingTask.status, priority: editingTask.priority, assigneeId: editingTask.assigneeId, dueDate: editingTask.dueDate }); setEditingTask(null); }}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingTask(null)} className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => onUpdateTask(task.id, { status: task.status === 'Done' ? 'Todo' : 'Done' })}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors flex items-center justify-center ${task.status === 'Done' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-500'}`}
                    >
                      {task.status === 'Done' && <span className="text-white text-xs">✓</span>}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-gray-900 ${task.status === 'Done' ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => setEditingTask({ ...task })} className="text-gray-400 hover:text-indigo-500 p-1 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick={() => {
                              if (deleteConfirm === task.id) { onDeleteTask(task.id); setDeleteConfirm(null); }
                              else { setDeleteConfirm(task.id); setTimeout(() => setDeleteConfirm(null), 2000); }
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {project && (
                          <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: project.color }}>
                            {project.name}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                          {task.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        {due && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${due.color}`}>
                            📅 {due.label}
                          </span>
                        )}
                        {assignee && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">{assignee.avatar[0]}</div>
                            {assignee.name.split(' ')[0]}
                          </span>
                        )}
                        {creator && currentUser.role === 'Admin' && (
                          <span className="text-xs text-gray-400">by {creator.name.split(' ')[0]}</span>
                        )}
                        {deleteConfirm === task.id && (
                          <span className="text-xs text-red-500 animate-pulse">Click again to delete</span>
                        )}
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={task.status}
                      onChange={e => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none cursor-pointer flex-shrink-0"
                    >
                      <option>Todo</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
