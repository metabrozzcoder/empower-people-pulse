
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Calendar, Users, Plus, MoreHorizontal } from "lucide-react"
import { Project } from "@/types/hrms"

export function ProjectKanban() {
  const [projects] = useState<Project[]>([
    {
      id: "1",
      title: "Morning Show Rebrand",
      description: "Complete visual identity overhaul for morning programming",
      status: "In Progress",
      priority: "High",
      assignedTo: ["sarah", "mike", "alex"],
      dueDate: "2024-02-15",
      createdDate: "2024-01-01",
      progress: 65,
      department: "Creative",
      tags: ["branding", "design", "urgent"]
    },
    {
      id: "2",
      title: "News Studio Setup",
      description: "Technical setup and equipment installation for new news studio",
      status: "Planning",
      priority: "Critical",
      assignedTo: ["john", "emma"],
      dueDate: "2024-01-30",
      createdDate: "2024-01-10",
      progress: 25,
      department: "Production",
      tags: ["technical", "infrastructure"]
    },
    {
      id: "3",
      title: "Content Calendar Q1",
      description: "Plan and schedule content for first quarter programming",
      status: "Review",
      priority: "Medium",
      assignedTo: ["lisa", "tom"],
      dueDate: "2024-02-01",
      createdDate: "2024-01-05",
      progress: 90,
      department: "Content",
      tags: ["planning", "content"]
    }
  ])

  const statuses = ["Planning", "In Progress", "Review", "Completed", "On Hold"]

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Planning': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Review': return 'bg-purple-100 text-purple-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'On Hold': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {statuses.map((status) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {status}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {projects.filter(p => p.status === status).length}
              </Badge>
            </div>

            <div className="space-y-3">
              {projects
                .filter(project => project.status === status)
                .map((project) => (
                  <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-sm font-medium">
                            {project.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(project.priority)}`} />
                            <Badge variant="outline" className={getStatusColor(project.status)}>
                              {project.priority}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <div className="flex -space-x-1">
                            {project.assignedTo.slice(0, 3).map((member, index) => (
                              <Avatar key={index} className="w-5 h-5 border border-background">
                                <AvatarFallback className="text-xs">
                                  {member.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {project.assignedTo.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs border border-background">
                                +{project.assignedTo.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
