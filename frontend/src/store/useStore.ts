import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Project, Task, TaskPriority, UserRole } from '../types';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function getUserId(user: User | null): string {
  return (user?.id || user?._id || '') as string;
}

export function useStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
      fetchTasks();
    }
  }, [currentUser]);

  const fetchProjects = async () => {
    const res = await API.get('/projects');
    setProjects(res.data);
  };

  const fetchTasks = async () => {
    const res = await API.get('/tasks');
    setTasks(res.data);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, role });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setProjects([]);
    setTasks([]);
  };

  const createProject = async (name: string, description: string) => {
    const res = await API.post('/projects', { name, description, color: '#6366f1' });
    setProjects(prev => [...prev, res.data]);
    return res.data;
  };

  const updateProject = async (id: string, updates: any) => {
    const res = await API.put(`/projects/${id}`, updates);
    setProjects(prev => prev.map(p => (p.id === id || p._id === id) ? res.data : p));
  };

  const deleteProject = async (id: string) => {
    await API.delete(`/projects/${id}`);
    setProjects(prev => prev.filter(p => p.id !== id && p._id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const addMemberToProject = async (projectId: string, userId: string) => {
    const project = projects.find(p => p._id === projectId || p.id === projectId);
    if (!project) return;
    const memberIds = [...(project.memberIds || []), userId];
    await updateProject(projectId, { memberIds });
  };

  const removeMemberFromProject = async (projectId: string, userId: string) => {
    const project = projects.find(p => p._id === projectId || p.id === projectId);
    if (!project) return;
    const memberIds = (project.memberIds || []).filter((id: string) => id !== userId);
    await updateProject(projectId, { memberIds });
  };

  const createTask = async (
    title: string,
    description: string,
    projectId: string,
    assigneeId: string | null,
    priority: TaskPriority,
    dueDate: string | null
  ) => {
    const res = await API.post('/tasks', { title, description, projectId, assigneeId, priority, dueDate });
    setTasks(prev => [...prev, res.data]);
    return res.data;
  };

  const updateTask = async (id: string, updates: any) => {
    const res = await API.put(`/tasks/${id}`, updates);
    setTasks(prev => prev.map(t => (t.id === id || t._id === id) ? res.data : t));
  };

  const deleteTask = async (id: string) => {
    await API.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id && t._id !== id));
  };

  const getUserProjects = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return projects;
    const uid = getUserId(currentUser);
    return projects.filter(p => (p.memberIds || []).includes(uid));
  };

  const getUserTasks = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return tasks;
    const uid = getUserId(currentUser);
    return tasks.filter(t => t.assigneeId === uid || t.createdById === uid);
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return getUserTasks().filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
    );
  };

  const getProjectTasks = (projectId: string) =>
    tasks.filter(t => t.projectId === projectId);

  const getUserById = (id: string) =>
    allUsers.find(u => u.id === id || u._id === id);

  const getProjectById = (id: string) =>
    projects.find(p => p.id === id || p._id === id);

  return {
    data: { users: allUsers, projects, tasks },
    currentUser,
    login,
    signup,
    logout,
    createProject,
    updateProject,
    deleteProject,
    addMemberToProject,
    removeMemberFromProject,
    createTask,
    updateTask,
    deleteTask,
    getUserProjects,
    getProjectTasks,
    getUserTasks,
    getOverdueTasks,
    getUserById,
    getProjectById,
    PROJECT_COLORS: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6', '#3b82f6'],
  };
}