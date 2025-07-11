import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, Clock, Plus, Filter, Calendar, User, Edit, Trash2, List, AlertCircle } from "lucide-react"
import { Task } from "@/types/hrms"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TaskBoard } from "@/components/TaskBoard"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface TaskFormData extends Omit<Partial<Task>, 'tags' | 'estimatedHours' | 'actualHours'> {
  tags?: string; 
  estimatedHours?: number | string; 
  actualHours?: number | string;   
}

// Dynamic configuration for priorities, statuses, and team members
const TASK_CONFIG = {
  priorities: [
    { value: 'Critical', label: 'Critical', color: 'border-red-500', bgColor: 'bg-red-100 text-red-800' },
    { value: 'High', label: 'High', color: 'border-orange-500', bgColor: 'bg-orange-100 text-orange-800' },
    { value: 'Medium', label: 'Medium', color: 'border-yellow-500', bgColor: 'bg-yellow-100 text-yellow-800' },
    { value: 'Low', label: 'Low', color: 'border-green-500', bgColor: 'bg-green-100 text-green-800' },
  ],
  statuses: [
    { value: 'Todo', label: 'Todo', color: 'bg-gray-100 text-gray-800', icon: Clock },
    { value: 'In Progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: CheckSquare },
    { value: 'Review', label: 'Review', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    { value: 'Done', label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckSquare },
  ],
  teamMembers: [
    { value: 'sarah', label: 'Sarah Chen', initials: 'SC' },
    { value: 'john', label: 'John Smith', initials: 'JS' },
    { value: 'lisa', label: 'Lisa Wang', initials: 'LW' },
    { value: 'mike', label: 'Mike Johnson', initials: 'MJ' },
    { value: 'emma', label: 'Emma Martinez', initials: 'EM' },
    { value: 'alex', label: 'Alex Thompson', initials: 'AT' },
  ],
  projects: [
    { value: '1', label: 'Morning Show Rebrand' },
    { value: '2', label: 'News Studio Setup' },
    { value: '3', label: 'Documentary Project' },
    { value: '4', label: 'Social Media Campaign' },
  ]
}

const Tasks = () => {
  const { toast } = useToast()
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterAssignee, setFilterAssignee] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState<TaskFormData>({}) 

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Edit Morning Show Intro",
      description: "Create new animated intro sequence for morning show rebrand",
      projectId: "1",
      assignedTo: "sarah",
      status: "In Progress",
      priority: "High",
      dueDate: "2024-01-20",
      estimatedHours: 8,
      actualHours: 5,
      tags: ["video-editing", "animation"]
    },
    {
      id: "2",
      title: "Setup Studio Lighting",
      description: "Install and configure new LED lighting system for news studio",
      projectId: "2",
      assignedTo: "john",
      status: "Todo",
      priority: "Critical",
      dueDate: "2024-01-18",
      estimatedHours: 12,
      tags: ["technical", "studio-setup"]
    },
  ])

  // Dynamic computed values
  const statusStats = useMemo(() => {
    return TASK_CONFIG.statuses.reduce((acc, status) => {
      acc[status.value] = tasks.filter(t => t.status === status.value).length
      return acc
    }, {} as Record<string, number>)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = filterStatus === "all" || task.status === filterStatus
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority
      const matchesAssignee = filterAssignee === "all" || task.assignedTo === filterAssignee
      const matchesSearch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return matchesStatus && matchesPriority && matchesAssignee && matchesSearch
    })
  }, [tasks, filterStatus, filterPriority, filterAssignee, searchTerm])

  // Dynamic helper functions
  const getStatusConfig = (status: Task['status']) => {
    return TASK_CONFIG.statuses.find(s => s.value === status) || TASK_CONFIG.statuses[0]
  }

  const getPriorityConfig = (priority: Task['priority']) => {
    return TASK_CONFIG.priorities.find(p => p.value === priority) || TASK_CONFIG.priorities[2]
  }

  const getTeamMemberConfig = (assignedTo: string) => {
    return TASK_CONFIG.teamMembers.find(t => t.value === assignedTo) || { 
      value: assignedTo, 
      label: assignedTo, 
      initials: assignedTo.substring(0, 2).toUpperCase() 
    }
  }

  const getProjectConfig = (projectId: string) => {
    return TASK_CONFIG.projects.find(p => p.value === projectId) || { 
      value: projectId, 
      label: `Project ${projectId}` 
    }
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    )
  }
  
  const handleTasksReorder = (reorderedTasks: Task[]) => {
    setTasks(reorderedTasks)
  }

  const handleCreateTask = (status: Task['status'] = 'Todo') => {
    const newTask = {
      id: `new-${Date.now().toString()}`,
      title: 'New Task',
      description: 'Please fill out the details for this task.',
      projectId: '1',
      assignedTo: '',
      status,
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
      estimatedHours: 0,
      actualHours: 0,
      tags: [],
    } as Task

    setSelectedTask(newTask)
    setFormData({ ...newTask, tags: '' })
    setIsTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setFormData({
      ...task,
      estimatedHours: task.estimatedHours || 0,
      actualHours: task.actualHours || 0,
      tags: Array.isArray(task.tags) ? task.tags.join(', ') : '' 
    })
    setIsTaskDialogOpen(true)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    toast({
      title: "Task Deleted",
      description: "Task has been successfully deleted.",
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: id === 'estimatedHours' || id === 'actualHours' ? Number(value) : value
    }))
  }

  const handleSelectChange = (value: string, field: keyof TaskFormData) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveTask = () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in task title and description.",
        variant: "destructive"
      })
      return
    }

    const isEditing = selectedTask && !selectedTask.id.startsWith('new-')

    const parsedTags = typeof formData.tags === 'string' 
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') 
      : []

    const taskToSave: Task = {
      id: isEditing ? selectedTask.id : Date.now().toString(),
      title: formData.title || "",
      description: formData.description || "",
      projectId: formData.projectId || "1",
      assignedTo: formData.assignedTo || "",
      status: formData.status || "Todo",
      priority: formData.priority || "Medium",
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      estimatedHours: Number(formData.estimatedHours) || 0,
      actualHours: Number(formData.actualHours) || 0,
      tags: parsedTags,
    }

    if (isEditing) {
      handleTaskUpdate(taskToSave)
      toast({
        title: "Task Updated",
        description: `Task "${taskToSave.title}" has been updated.`,
      })
    } else {
      setTasks(prevTasks => [...prevTasks, taskToSave])
      toast({
        title: "Task Created",
        description: `Task "${taskToSave.title}" has been successfully created.`,
      })
    }

    setIsTaskDialogOpen(false)
    setFormData({}) 
    setSelectedTask(null) 
  }

  const clearAllFilters = () => {
    setFilterStatus("all")
    setFilterPriority("all")
    setFilterAssignee("all")
    setSearchTerm("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
        <p className="text-muted-foreground">
          Track and manage tasks across all your projects and teams.
        </p>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {TASK_CONFIG.statuses.map((status) => {
          const Icon = status.icon
          return (
            <Card key={status.value}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{status.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusStats[status.value] || 0}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="kanban" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-6">
          {/* Enhanced Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px]"
              />
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {TASK_CONFIG.priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-[180px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {TASK_CONFIG.teamMembers.map(member => (
                    <SelectItem key={member.value} value={member.value}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filterPriority !== "all" || filterAssignee !== "all" || searchTerm) && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <Button onClick={() => handleCreateTask()}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          <TaskBoard 
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleDeleteTask}
            onTaskCreate={handleCreateTask}
            onTaskEdit={handleEditTask}
            onTasksReorder={handleTasksReorder}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
                  <CardDescription>View and manage all tasks in a list format.</CardDescription>
                </div>
                <Button onClick={() => handleCreateTask()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Enhanced List Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[200px]"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {TASK_CONFIG.statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {TASK_CONFIG.priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {TASK_CONFIG.teamMembers.map(member => (
                      <SelectItem key={member.value} value={member.value}>
                        {member.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filterStatus !== "all" || filterPriority !== "all" || filterAssignee !== "all" || searchTerm) && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {filteredTasks.length > 0 ? filteredTasks.map(task => {
                  const statusConfig = getStatusConfig(task.status)
                  const priorityConfig = getPriorityConfig(task.priority)
                  const memberConfig = getTeamMemberConfig(task.assignedTo)
                  const projectConfig = getProjectConfig(task.projectId)
                  
                  return (
                    <Card key={task.id} className={`border-l-4 ${priorityConfig.color}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>{memberConfig.initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{task.title}</p>
                              <Badge className={statusConfig.color}>{task.status}</Badge>
                              <Badge variant="outline">{priorityConfig.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {memberConfig.label}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              <span>{projectConfig.label}</span>
                            </div>
                            {task.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {task.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-24">
                            <Progress 
                              value={(task.actualHours && task.estimatedHours) ? (task.actualHours / task.estimatedHours) * 100 : 0} 
                            />
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleEditTask(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }) : (
                  <div className="text-center py-10">
                    <List className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || filterStatus !== "all" || filterPriority !== "all" || filterAssignee !== "all" 
                        ? "Try adjusting your filters or search term."
                        : "Get started by creating a new task."
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Task Creation and Editing Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTask && !selectedTask.id.startsWith('new-') ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <DialogDescription>
              {selectedTask && !selectedTask.id.startsWith('new-') ? 'Update task details and assignments' : 'Create a new task with details and assignments'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input id="title" placeholder="Enter task title" value={formData.title || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority || "Medium"} onValueChange={(value) => handleSelectChange(value, 'priority')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CONFIG.priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Enter task description" value={formData.description || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select value={formData.projectId || "1"} onValueChange={(value) => handleSelectChange(value, 'projectId')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CONFIG.projects.map(project => (
                    <SelectItem key={project.value} value={project.value}>
                      {project.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select value={formData.assignedTo || ''} onValueChange={(value) => handleSelectChange(value, 'assignedTo')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CONFIG.teamMembers.map(member => (
                    <SelectItem key={member.value} value={member.value}>
                      {member.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status || "Todo"} onValueChange={(value) => handleSelectChange(value, 'status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CONFIG.statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={formData.dueDate || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input id="estimatedHours" type="number" placeholder="0" value={formData.estimatedHours || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualHours">Actual Hours</Label>
              <Input id="actualHours" type="number" placeholder="0" value={formData.actualHours || ''} onChange={handleChange} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" placeholder="tag1, tag2, tag3" value={formData.tags || ''} onChange={handleChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask}>
              {selectedTask && !selectedTask.id.startsWith('new-') ? 'Update' : 'Create'} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Tasks