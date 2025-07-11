import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2, Calendar, User, Clock, Tag } from "lucide-react"
import { Task } from "@/types/hrms"
import { useToast } from "@/hooks/use-toast"

interface TaskBoardProps {
  tasks: Task[]
  onTaskUpdate: (task: Task) => void
  onTasksReorder: (tasks: Task[]) => void
  onTaskDelete: (taskId: string) => void
  onTaskCreate: (status?: Task['status']) => void
  onTaskEdit: (task: Task) => void
}

export function TaskBoard({ tasks, onTaskUpdate, onTasksReorder, onTaskDelete, onTaskCreate, onTaskEdit }: TaskBoardProps) {
  const { toast } = useToast()
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null)

  const statuses: Task['status'][] = ['Todo', 'In Progress', 'Review', 'Done']
  
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status)
    return acc
  }, {} as Record<Task['status'], Task[]>)

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500'
      case 'High': return 'bg-orange-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: Task['status'], index?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
    setDragOverIndex(index ?? null)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, newStatus: Task['status'], dropIndex?: number) => {
    e.preventDefault()
    
    if (!draggedTask) return

    const sourceTasks = tasksByStatus[draggedTask.status]
    const targetTasks = tasksByStatus[newStatus]
    
    // If same status, reorder within column
    if (draggedTask.status === newStatus && dropIndex !== undefined) {
      const currentIndex = sourceTasks.findIndex(t => t.id === draggedTask.id)
      const newIndex = dropIndex
      
      if (currentIndex !== newIndex) {
        // Create new array with reordered tasks for this column
        const reorderedColumnTasks = [...sourceTasks]
        reorderedColumnTasks.splice(currentIndex, 1)
        reorderedColumnTasks.splice(newIndex, 0, draggedTask)
        
        // Create the full updated tasks array
        const allTasksMap = new Map(tasks.map(task => [task.id, task]))
        reorderedColumnTasks.forEach((task, index) => {
          allTasksMap.set(task.id, { ...task, position: index })
        })
        
        onTasksReorder(Array.from(allTasksMap.values()))
        
        toast({
          title: "Task Reordered",
          description: `Task moved within ${newStatus}`,
        })
      }
    } else if (draggedTask.status !== newStatus) {
      // Move to different column
      const updatedTask = { 
        ...draggedTask, 
        status: newStatus,
        position: dropIndex ?? targetTasks.length 
      }
      onTaskUpdate(updatedTask)
      toast({
        title: "Task Updated",
        description: `Task moved to ${newStatus}`,
      })
    }
    
    setDraggedTask(null)
    setDragOverIndex(null)
    setDragOverColumn(null)
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statuses.map((status) => (
        <div
          key={status}
          className="space-y-4"
          onDragOver={(e) => handleDragOver(e, status)}
          onDrop={(e) => handleDrop(e, status)}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {status}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {tasksByStatus[status].length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => onTaskCreate(status)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1 min-h-[500px] p-3 bg-muted/20 rounded-lg">
            {tasksByStatus[status].map((task, index) => (
              <div key={task.id}>
                {/* Drop zone above task */}
                <div
                  className={`h-2 rounded transition-all ${
                    dragOverColumn === status && dragOverIndex === index
                      ? 'bg-primary/20 border-2 border-dashed border-primary'
                      : 'hover:bg-muted/40'
                  }`}
                  onDragOver={(e) => handleDragOver(e, status, index)}
                  onDrop={(e) => handleDrop(e, status, index)}
                />
                <Card
                  className="cursor-move hover:shadow-md transition-shadow bg-background mb-2"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => onTaskEdit(task)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onTaskDelete(task.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>

                    {task.estimatedHours && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{Math.round(((task.actualHours || 0) / task.estimatedHours) * 100)}%</span>
                        </div>
                        <Progress value={((task.actualHours || 0) / task.estimatedHours) * 100} className="h-1" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {task.assignedTo.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {task.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{task.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {/* Drop zone at the bottom */}
            <div
              className={`h-4 rounded transition-all ${
                dragOverColumn === status && dragOverIndex === tasksByStatus[status].length
                  ? 'bg-primary/20 border-2 border-dashed border-primary'
                  : 'hover:bg-muted/40'
              }`}
              onDragOver={(e) => handleDragOver(e, status, tasksByStatus[status].length)}
              onDrop={(e) => handleDrop(e, status, tasksByStatus[status].length)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}