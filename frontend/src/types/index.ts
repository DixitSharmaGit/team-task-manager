export type UserRole = 'Admin' | 'Member';
export type TaskStatus = 'Todo' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
}

export interface Project {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  ownerId?: string;
  memberIds?: string[];
  color?: string;
  createdAt?: string;
}

export interface Task {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  projectId?: string;
  assigneeId?: string | null;
  createdById?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppData {
  users: User[];
  projects: Project[];
  tasks: Task[];
}