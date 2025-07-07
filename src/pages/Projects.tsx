
import React, { useState } from 'react'
import { ProjectGrid } from "@/components/ProjectGrid"
import { Project } from "@/types/hrms"
import { useToast } from "@/hooks/use-toast"

const Projects = () => {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      title: "Morning Show Rebrand",
      description: "Complete visual identity overhaul for morning programming including new graphics, intro sequences, and studio design elements.",
      status: "In Progress",
      priority: "High",
      assignedTo: ["sarah", "mike", "alex", "emma"],
      dueDate: "2024-02-15",
      createdDate: "2024-01-01",
      progress: 65,
      department: "Creative",
      tags: ["branding", "design", "urgent", "graphics"]
    },
    {
      id: "2", 
      title: "News Studio Setup",
      description: "Technical setup and equipment installation for new news studio including cameras, lighting, and audio systems.",
      status: "Planning",
      priority: "Critical",
      assignedTo: ["john", "emma", "tom"],
      dueDate: "2024-01-30",
      createdDate: "2024-01-10",
      progress: 25,
      department: "Production",
      tags: ["technical", "infrastructure", "urgent"]
    },
    {
      id: "3",
      title: "Content Calendar Q1",
      description: "Plan and schedule content for first quarter programming across all channels and platforms.",
      status: "Review",
      priority: "Medium",
      assignedTo: ["lisa", "tom", "sarah"],
      dueDate: "2024-02-01",
      createdDate: "2024-01-05",
      progress: 90,
      department: "Content",
      tags: ["planning", "content", "quarterly"]
    },
    {
      id: "4",
      title: "Mobile App Development",
      description: "Develop companion mobile application for live streaming and on-demand content viewing.",
      status: "Planning",
      priority: "Low",
      assignedTo: ["alex", "mike"],
      dueDate: "2024-03-15",
      createdDate: "2024-01-12",
      progress: 10,
      department: "Technology",
      tags: ["mobile", "app", "development", "streaming"]
    },
    {
      id: "5",
      title: "Podcast Studio Build",
      description: "Construction and setup of dedicated podcast recording studio with professional equipment.",
      status: "Completed",
      priority: "Medium",
      assignedTo: ["john", "emma"],
      dueDate: "2024-01-20",
      createdDate: "2023-12-15",
      progress: 100,
      department: "Production",
      tags: ["podcast", "studio", "audio", "completed"]
    }
  ])

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    )
  }

  const handleProjectDelete = (projectId: string) => {
    setProjects(prevProjects => 
      prevProjects.filter(project => project.id !== projectId)
    )
  }

  const handleProjectCreate = () => {
    toast({
      title: "Create New Project",
      description: "Opening project creation dialog...",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
        <p className="text-muted-foreground">
          Manage and track all your projects with enhanced visibility and control.
        </p>
      </div>

      <ProjectGrid 
        projects={projects}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
        onProjectCreate={handleProjectCreate}
      />
    </div>
  )
}

export default Projects
