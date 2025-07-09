
export interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string
  hireDate: string
  salary: number
  status: 'Active' | 'Inactive' | 'On Leave'
  avatar?: string
  phone: string
  location: string
  manager?: string
  performanceScore: number
  skills: string[]
  contractType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern'
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  assignedTo: string[]
  dueDate: string
  createdDate: string
  progress: number
  department: string
  tags: string[]
}

export interface Task {
  id: string
  title: string
  description: string
  projectId: string
  assignedTo: string
  status: 'Todo' | 'In Progress' | 'Review' | 'Done'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate: string
  estimatedHours: number
  actualHours?: number
  tags: string[]
  position?: number
}

export interface Shift {
  id: string
  employeeId: string
  date: string
  startTime: string
  endTime: string
  role: string
  location: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  notes?: string
}

export interface KPI {
  id: string
  name: string
  value: number
  target: number
  unit: string
  department: string
  period: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'
  trend: 'up' | 'down' | 'stable'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  userId: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface AIInsight {
  id: string
  type: 'recruitment' | 'performance' | 'scheduling' | 'project' | 'general'
  title: string
  description: string
  confidence: number
  actionable: boolean
  suggestedActions?: string[]
  createdAt: string
}
