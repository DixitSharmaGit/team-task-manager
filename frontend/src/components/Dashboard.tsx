import { User, Task, Project } from '../types';

interface Props {
  currentUser: User;
  allTasks: Task[];
  projects: Project[];
  overdueTasks: Task[];
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  onViewProject: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export default function Dashboard({
  currentUser,
  allTasks,
  projects,
  overdueTasks,
  getProjectById,
  onViewProject,
  onUpdateTask,
}: Props) {
  const todoTasks = allTasks.filter(t => t.status === 'Todo');
  const inProgressTasks = allTasks.filter(t => t.status === 'In Progress');
  const doneTasks = allTasks.filter(t => t.status === 'Done');

  const myAssignedTasks = allTasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'Done');

  const stats = [
    { label: 'Total Projects', value: projects.length, color: 'bg-indigo-500', icon: '📁' },
    { label: 'Total Tasks', value: allTasks.length, color: 'bg-purple-500', icon: '📋' },
    { label: 'In Progress', value: inProgressTasks.length, color: 'bg-yellow-500', icon: '⚡' },
    { label: 'Completed', value: doneTasks.length, color: 'bg-green-500', icon: '✅' },
    { label: 'Overdue', value: overdueTasks.length, color: 'bg-red-500', icon: '⚠️' },
    { label: 'Todo', value: todoTasks.length, color: 'bg-blue-500', icon: '📌' },
  ];

  const completionRate = allTasks.length > 0 ? Math.round((doneTasks.length / allTasks.length) * 100) : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-red-600 bg-red-50' };
    if (days === 0) return { label: 'Due today', color: 'text-orange-600 bg-orange-50' };
    if (days === 1) return { label: 'Due tomorrow', color: 'text-yellow-600 bg-yellow-50' };
    return { label: `Due in ${days}d`, color: 'text-green-600 bg-green-50' };
  };

  const priorityColor = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser.name.split(' ')[0]}! 👋
        </h2>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress + Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Overall Progress</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="10"
                  strokeDasharray={`${completionRate * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{completionRate}%</span>
                <span className="text-xs text-gray-500">Complete</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Todo</span>
              <span className="font-medium text-blue-600">{todoTasks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">In Progress</span>
              <span className="font-medium text-yellow-600">{inProgressTasks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Done</span>
              <span className="font-medium text-green-600">{doneTasks.length}</span>
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">My Active Tasks</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {myAssignedTasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No tasks assigned to you 🎉</p>
            ) : (
              myAssignedTasks.slice(0, 5).map(task => {
                const due = formatDueDate(task.dueDate);
                const project = getProjectById(task.projectId);
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => onUpdateTask(task.id, { status: task.status === 'Todo' ? 'In Progress' : 'Done' })}
                      className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5 hover:border-indigo-500 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {project && (
                          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: project.color }}>
                            {project.name}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[task.priority]}`}>
                          {task.priority}
                        </span>
                        {due && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${due.color}`}>
                            {due.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Overdue + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-500">⚠️</span>
              <h3 className="font-semibold text-gray-800">Overdue Tasks ({overdueTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {overdueTasks.slice(0, 4).map(task => {
                const project = getProjectById(task.projectId);
                const daysOverdue = Math.ceil((new Date().getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-red-600 mt-0.5">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue · {project?.name}</p>
                    </div>
                    <button
                      onClick={() => onUpdateTask(task.id, { status: 'Done' })}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors flex-shrink-0"
                    >
                      Mark Done
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Projects Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Projects Overview</h3>
          <div className="space-y-3">
            {projects.slice(0, 4).map(project => {
              const projectTasks = allTasks.filter(t => t.projectId === project.id);
              const completed = projectTasks.filter(t => t.status === 'Done').length;
              const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
              return (
                <button
                  key={project.id}
                  onClick={() => onViewProject(project.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="text-sm font-medium text-gray-800">{project.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{completed}/{projectTasks.length}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: project.color }}
                    />
                  </div>
                </button>
              );
            })}
            {projects.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No projects yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allTasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6).map(task => {
            const project = getProjectById(task.projectId);
            const statusColor = {
              'Todo': 'bg-gray-100 text-gray-600',
              'In Progress': 'bg-yellow-100 text-yellow-700',
              'Done': 'bg-green-100 text-green-700',
            };
            return (
              <div key={task.id} className="border border-gray-100 rounded-lg p-3 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{task.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor[task.status]}`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {project && (
                    <span className="text-xs text-gray-500">{project.name}</span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(task.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
