import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Users, 
  Plus, 
  MoreHorizontal, 
  Clock, 
  Target,
  Briefcase,
  Edit,
  Trash2,
  Eye,
  Settings,
  Play,
  Pause,
  CheckCircle
} from "lucide-react"
import { Project } from "@/types/hrms"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectGridProps {
  projects: Project[]
  onProjectUpdate: (project: Project) => void
  onProjectDelete: (projectId: string) => void
  onProjectCreate: () => void
}

export function ProjectGrid({ projects, onProjectUpdate, onProjectDelete, onProjectCreate }: ProjectGridProps) {
  const { toast } = useToast()

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Planning': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Review': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'On Hold': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500'
      case 'High': return 'bg-orange-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const handleStatusChange = (project: Project, newStatus: Project['status']) => {
    const updatedProject = { ...project, status: newStatus }
    onProjectUpdate(updatedProject)
    toast({
      title: "Project Updated",
      description: `${project.title} status changed to ${newStatus}`,
    })
  }

  const handleProjectAction = (action: string, project: Project) => {
    switch (action) {
      case 'edit':
        toast({
          title: "Edit Project",
          description: `Opening edit dialog for ${project.title}`,
        })
        break
      case 'view':
        toast({
          title: "View Project",
          description: `Opening detailed view for ${project.title}`,
        })
        break
      case 'settings':
        toast({
          title: "Project Settings",
          description: `Opening settings for ${project.title}`,
        })
        break
      case 'delete':
        onProjectDelete(project.id)
        toast({
          title: "Project Deleted",
          description: `${project.title} has been deleted`,
          variant: "destructive"
        })
        break
      default:
        break
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projects Overview</h2>
        <Button onClick={onProjectCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border-l-4" 
                style={{ borderLeftColor: project.priority === 'Critical' ? '#ef4444' : 
                                        project.priority === 'High' ? '#f97316' :
                                        project.priority === 'Medium' ? '#eab308' : '#22c55e' }}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(project.status)} variant="outline">
                      {project.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
                      <span className="text-xs text-muted-foreground">{project.priority}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleProjectAction('view', project)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProjectAction('edit', project)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProjectAction('settings', project)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleProjectAction('delete', project)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {project.description}
              </CardDescription>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(project.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{project.department}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team Members</span>
                  <span className="text-sm font-medium">{project.assignedTo.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {project.assignedTo.slice(0, 4).map((member, index) => (
                      <Avatar key={index} className="w-8 h-8 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {member.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.assignedTo.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{project.assignedTo.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  {project.status === 'In Progress' ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                {project.status !== 'Completed' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleStatusChange(project, 'Completed')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}