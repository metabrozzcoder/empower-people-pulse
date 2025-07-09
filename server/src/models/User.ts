export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'Admin' | 'HR' | 'Guest';
  status: 'Active' | 'Inactive' | 'Pending';
  department?: string;
  organization?: string;
  linked_employee?: string;
  last_login?: Date;
  created_date: Date;
  updated_date: Date;
  permissions: string[];
  username: string;
  password_hash: string;
  guest_id?: string;
  section_access?: string[];
  allowed_sections?: string[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'HR' | 'Guest';
  department?: string;
  organization?: string;
  linked_employee?: string;
  permissions: string[];
  username: string;
  password: string;
  guest_id?: string;
  section_access?: string[];
  allowed_sections?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'Admin' | 'HR' | 'Guest';
  status?: 'Active' | 'Inactive' | 'Pending';
  department?: string;
  organization?: string;
  linked_employee?: string;
  permissions?: string[];
  guest_id?: string;
  section_access?: string[];
  allowed_sections?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}