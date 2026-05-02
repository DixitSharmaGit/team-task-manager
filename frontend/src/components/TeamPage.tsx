import { useState } from 'react';
import { User, Task, Project } from '../types';

interface Props {
  currentUser: User;
  allUsers: User[];
  tasks: Task[];
  projects: Project[];
}

export default function TeamPage({ currentUser, allUsers, tasks, projects }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'All' | 'Admin' | 'Member'>('All');

  if (currentUser.role !== 'Admin') {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <p className="text-gray-700 font-semibold">Access Restricted</p>
          <p className="text-gray-500 text-sm mt-1">Only admins can view the team page</p>
        </div>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(user => {
    if (filterRole !== 'All' && user.role !== filterRole) return false;
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getUserStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assigneeId === userId);
    const completed = userTasks.filter(t => t.status === 'Done').length;
    const inProgress = userTasks.filter(t => t.status === 'In Progress').length;
    const overdue = userTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done').length;
    const userProjects = projects.filter(p => p.memberIds.includes(userId));
    return { total: userTasks.length, completed, inProgress, overdue, projects: userProjects.length };
  };

  const adminCount = allUsers.filter(u => u.role === 'Admin').length;
  const memberCount = allUsers.filter(u => u.role === 'Member').length;

  const getAvatarColor = (id: string) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#14b8a6', '#3b82f6', '#22c55e'];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatJoined = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team</h2>
          <p className="text-gray-500 text-sm mt-1">{allUsers.length} total members</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">{allUsers.length}</div>
          <div className="text-sm text-gray-500">Total Members</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-purple-600">{adminCount}</div>
          <div className="text-sm text-gray-500">Admins</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-indigo-600">{memberCount}</div>
          <div className="text-sm text-gray-500">Members</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-green-600">{projects.length}</div>
          <div className="text-sm text-gray-500">Active Projects</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="🔍 Search members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-48"
          />
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['All', 'Admin', 'Member'] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${filterRole === r ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const stats = getUserStats(user.id);
          const avatarColor = getAvatarColor(user.id);
          const isCurrentUser = user.id === currentUser.id;
          const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const userProjects = projects.filter(p => p.memberIds.includes(user.id));

          return (
            <div key={user.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isCurrentUser ? 'border-indigo-200' : 'border-gray-100'}`}>
              {isCurrentUser && (
                <div className="h-1 bg-indigo-500" />
              )}
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      {isCurrentUser && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">You</span>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role === 'Admin' ? '👑 Admin' : '👤 Member'}
                      </span>
                      <span className="text-xs text-gray-400">Joined {formatJoined(user.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                    <div className="text-xs text-gray-500">Done</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2">
                    <div className="text-lg font-bold text-yellow-600">{stats.inProgress}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className={`rounded-lg p-2 ${stats.overdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className={`text-lg font-bold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stats.overdue}</div>
                    <div className="text-xs text-gray-500">Overdue</div>
                  </div>
                </div>

                {/* Completion Rate */}
                {stats.total > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Completion Rate</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${completionRate}%`, backgroundColor: avatarColor }}
                      />
                    </div>
                  </div>
                )}

                {/* Projects */}
                {userProjects.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Projects ({stats.projects})</p>
                    <div className="flex flex-wrap gap-1">
                      {userProjects.slice(0, 3).map(p => (
                        <span
                          key={p.id}
                          className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.name}
                        </span>
                      ))}
                      {userProjects.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          +{userProjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-gray-500 font-medium">No members found</p>
        </div>
      )}
    </div>
  );
}
