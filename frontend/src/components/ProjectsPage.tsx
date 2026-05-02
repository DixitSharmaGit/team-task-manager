import { useState } from 'react';
import { User, Project, Task } from '../types';

interface Props {
  currentUser: User;
  projects: Project[];
  tasks: Task[];
  allUsers: User[];
  selectedProjectId: string | null;
  onCreateProject: (name: string, desc: string) => void;
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onAddMember: (projectId: string, userId: string) => void;
  onRemoveMember: (projectId: string, userId: string) => void;
  onCreateTask: (title: string, desc: string, projectId: string, assigneeId: string | null, priority: 'Low' | 'Medium' | 'High', dueDate: string | null) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  getUserById: (id: string) => User | undefined;
}

type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export default function ProjectsPage({
  currentUser, projects, tasks, allUsers, selectedProjectId,
  onCreateProject, onDeleteProject, onAddMember, onRemoveMember,
  onCreateTask, onUpdateTask, onDeleteTask, getUserById
}: Props) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(
    selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null
  );
  const [showNewTask, setShowNewTask] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assigneeId: '', priority: 'Medium' as 'Low' | 'Medium' | 'High', dueDate: ''
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | TaskStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Sync when selectedProjectId changes
  if (selectedProjectId && activeProject?.id !== selectedProjectId) {
    const found = projects.find(p => p.id === selectedProjectId);
    if (found) setActiveProject(found);
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectDesc.trim());
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProject(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !taskForm.title.trim()) return;
    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        assigneeId: taskForm.assigneeId || null,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
      });
    } else {
      onCreateTask(
        taskForm.title.trim(), taskForm.description.trim(), activeProject.id,
        taskForm.assigneeId || null, taskForm.priority, taskForm.dueDate || null
      );
    }
    setTaskForm({ title: '', description: '', assigneeId: '', priority: 'Medium', dueDate: '' });
    setShowNewTask(false);
    setEditingTask(null);
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      assigneeId: task.assigneeId || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setShowNewTask(true);
  };

  const canManageProject = (project: Project) =>
    currentUser.role === 'Admin' || project.ownerId === currentUser.id;

  const getProjectTasks = (projectId: string) => {
    let filtered = tasks.filter(t => t.projectId === projectId);
    if (filterStatus !== 'All') filtered = filtered.filter(t => t.status === filterStatus);
    if (searchQuery) filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered;
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-red-600 bg-red-50 border-red-200' };
    if (days === 0) return { label: 'Due today', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-500 bg-gray-50 border-gray-200' };
  };

  const statusColors: Record<TaskStatus, string> = {
    'Todo': 'bg-slate-100 text-slate-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    'Done': 'bg-green-100 text-green-700',
  };

  const priorityDot: Record<string, string> = {
    High: 'bg-red-400',
    Medium: 'bg-yellow-400',
    Low: 'bg-green-400',
  };

  if (activeProject) {
    const projectTasks = getProjectTasks(activeProject.id);
    const members = activeProject.memberIds.map(id => getUserById(id)).filter(Boolean) as User[];
    const nonMembers = allUsers.filter(u => !activeProject.memberIds.includes(u.id));
    const todoCount = tasks.filter(t => t.projectId === activeProject.id && t.status === 'Todo').length;
    const inProgressCount = tasks.filter(t => t.projectId === activeProject.id && t.status === 'In Progress').length;
    const doneCount = tasks.filter(t => t.projectId === activeProject.id && t.status === 'Done').length;
    const totalCount = tasks.filter(t => t.projectId === activeProject.id).length;

    return (
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setActiveProject(null)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← Projects
          </button>
          <span className="text-gray-400">/</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeProject.color }} />
            <span className="font-semibold text-gray-800">{activeProject.name}</span>
          </div>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{activeProject.name}</h2>
              <p className="text-gray-500 text-sm">{activeProject.description || 'No description'}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>📅 {new Date(activeProject.createdAt).toLocaleDateString()}</span>
                <span>👥 {members.length} members</span>
                <span>📋 {totalCount} tasks</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                👥 Members
              </button>
              {canManageProject(activeProject) && (
                <>
                  <button
                    onClick={() => setShowNewTask(true)}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    + Add Task
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Delete this project and all its tasks?')) { onDeleteProject(activeProject.id); setActiveProject(null); } }}
                    className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    🗑️
                  </button>
                </>
              )}
              {!canManageProject(activeProject) && (
                <button
                  onClick={() => setShowNewTask(true)}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%',
                  backgroundColor: activeProject.color
                }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>📌 {todoCount} todo</span>
              <span>⚡ {inProgressCount} in progress</span>
              <span>✅ {doneCount} done</span>
            </div>
          </div>
        </div>

        {/* Members Panel */}
        {showMembers && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Team Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role} · {member.email}</p>
                    </div>
                  </div>
                  {canManageProject(activeProject) && member.id !== activeProject.ownerId && (
                    <button
                      onClick={() => onRemoveMember(activeProject.id, member.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  {member.id === activeProject.ownerId && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Owner</span>
                  )}
                </div>
              ))}
            </div>
            {canManageProject(activeProject) && nonMembers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Add Members</p>
                <div className="flex flex-wrap gap-2">
                  {nonMembers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => onAddMember(activeProject.id, user.id)}
                      className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">{user.avatar}</div>
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            {(['All', 'Todo', 'In Progress', 'Done'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <span className="text-sm text-gray-500 ml-auto">{projectTasks.length} tasks</span>
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Todo', 'In Progress', 'Done'] as TaskStatus[]).map(status => {
            const columnTasks = projectTasks.filter(t => t.status === status);
            const columnAll = tasks.filter(t => t.projectId === activeProject.id && t.status === status);
            const headerColors = { Todo: 'border-slate-300', 'In Progress': 'border-yellow-400', Done: 'border-green-400' };
            return (
              <div key={status} className="bg-gray-50 rounded-xl p-4">
                <div className={`flex items-center justify-between mb-3 pb-3 border-b-2 ${headerColors[status]}`}>
                  <h4 className="font-semibold text-sm text-gray-700">{status}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>
                    {columnAll.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnTasks.map(task => {
                    const due = formatDueDate(task.dueDate);
                    const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;
                    return (
                      <div key={task.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => startEditTask(task)} className="text-gray-400 hover:text-indigo-500 p-1 rounded">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            {(canManageProject(activeProject) || task.createdById === currentUser.id) && (
                              <button
                                onClick={() => {
                                  if (deleteConfirm === task.id) { onDeleteTask(task.id); setDeleteConfirm(null); }
                                  else setDeleteConfirm(task.id);
                                  setTimeout(() => setDeleteConfirm(null), 2000);
                                }}
                                className="text-gray-400 hover:text-red-500 p-1 rounded"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                        {task.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
                          <span className="text-xs text-gray-500">{task.priority}</span>
                          {due && <span className={`text-xs px-2 py-0.5 rounded-full border ${due.color}`}>{due.label}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                                {assignee.avatar}
                              </div>
                              <span className="text-xs text-gray-500">{assignee.name.split(' ')[0]}</span>
                            </div>
                          ) : <span className="text-xs text-gray-400">Unassigned</span>}
                          {/* Status change */}
                          <select
                            value={task.status}
                            onChange={e => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none cursor-pointer"
                          >
                            <option>Todo</option>
                            <option>In Progress</option>
                            <option>Done</option>
                          </select>
                        </div>
                        {deleteConfirm === task.id && (
                          <p className="text-xs text-red-500 mt-2 text-center animate-pulse">Click again to confirm delete</p>
                        )}
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-300 text-sm">
                      <p className="text-2xl mb-1">📭</p>
                      <p>No tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Task Modal */}
        {showNewTask && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-5">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Task title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    required autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Task description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                    <select
                      value={taskForm.assigneeId}
                      onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as 'Low' | 'Medium' | 'High' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowNewTask(false); setEditingTask(null); setTaskForm({ title: '', description: '', assigneeId: '', priority: 'Medium', dueDate: '' }); }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Projects List View
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          + New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const done = projectTasks.filter(t => t.status === 'Done').length;
          const inProg = projectTasks.filter(t => t.status === 'In Progress').length;
          const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;
          const members = project.memberIds.map(id => getUserById(id)).filter(Boolean) as User[];
          const overdue = projectTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done').length;

          return (
            <div
              key={project.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setActiveProject(project)}
            >
              <div className="h-2" style={{ backgroundColor: project.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description || 'No description'}</p>
                  </div>
                  {overdue > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
                      {overdue} overdue
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{done}/{projectTasks.length} tasks complete</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {members.slice(0, 4).map(m => (
                      <div key={m.id} className="w-7 h-7 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" title={m.name}>
                        {m.avatar}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="w-7 h-7 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>⚡ {inProg}</span>
                    <span>📋 {projectTasks.length}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* New Project Card */}
        <button
          onClick={() => setShowNewProject(true)}
          className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 p-8 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 min-h-44"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl">+</div>
          <p className="text-sm font-medium text-gray-600">Create New Project</p>
        </button>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowNewProject(false); setNewProjectName(''); setNewProjectDesc(''); }} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
