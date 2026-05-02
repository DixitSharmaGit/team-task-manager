import { useState } from 'react';
import { useStore } from './store/useStore';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectsPage from './components/ProjectsPage';
import TasksPage from './components/TasksPage';
import TeamPage from './components/TeamPage';


type Page = 'dashboard' | 'projects' | 'tasks' | 'team';

export default function App() {
  const store = useStore();
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: Page, projectId?: string) => {
    setActivePage(page);
    setActiveProjectId(projectId || null);
  };

  if (!store.currentUser) {
    return <AuthPage onLogin={store.login} onSignup={store.signup} />;
  }

  const userProjects = store.getUserProjects();
  const userTasks = store.getUserTasks();
  const overdueTasks = store.getOverdueTasks();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            currentUser={store.currentUser!}
            allTasks={userTasks}
            projects={userProjects}
            overdueTasks={overdueTasks}
            getUserById={store.getUserById}
            getProjectById={store.getProjectById}
            onViewProject={(id) => handleNavigate('projects', id)}
            onUpdateTask={store.updateTask}
          />
        );
      case 'projects':
        return (
          <ProjectsPage
            currentUser={store.currentUser!}
            projects={userProjects}
            tasks={store.data.tasks}
            allUsers={store.data.users}
            selectedProjectId={activeProjectId}
            onCreateProject={store.createProject}
            onUpdateProject={store.updateProject}
            onDeleteProject={store.deleteProject}
            onAddMember={store.addMemberToProject}
            onRemoveMember={store.removeMemberFromProject}
            onCreateTask={store.createTask}
            onUpdateTask={store.updateTask}
            onDeleteTask={store.deleteTask}
            getUserById={store.getUserById}
          />
        );
      case 'tasks':
        return (
          <TasksPage
            currentUser={store.currentUser!}
            tasks={userTasks}
            projects={userProjects}
            allUsers={store.data.users}
            onUpdateTask={store.updateTask}
            onDeleteTask={store.deleteTask}
            getUserById={store.getUserById}
            getProjectById={store.getProjectById}
          />
        );
      case 'team':
        return (
          <TeamPage
            currentUser={store.currentUser!}
            allUsers={store.data.users}
            tasks={store.data.tasks}
            projects={store.data.projects}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentUser={store.currentUser}
        projects={userProjects}
        activePage={activePage}
        activeProjectId={activeProjectId}
        onNavigate={handleNavigate}
        onLogout={store.logout}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-gray-900 capitalize">
                {activePage === 'projects' && activeProjectId
                  ? store.getProjectById(activeProjectId)?.name || 'Projects'
                  : activePage.charAt(0).toUpperCase() + activePage.slice(1)
                }
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell - overdue tasks */}
            {overdueTasks.length > 0 && (
              <button
                onClick={() => handleNavigate('tasks')}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={`${overdueTasks.length} overdue tasks`}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {overdueTasks.length > 9 ? '9+' : overdueTasks.length}
                </span>
              </button>
            )}

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {store.currentUser.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{store.currentUser.name.split(' ')[0]}</p>
                <p className="text-xs text-gray-400">{store.currentUser.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="max-w-7xl mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
