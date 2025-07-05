
export interface Employee {
  id: number
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
}

export interface Department {
  id: string
  name: string
  headCount: number
  manager: string
}
