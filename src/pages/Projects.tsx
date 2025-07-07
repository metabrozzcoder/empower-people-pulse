
import React, { useState } from 'react'
import { ProjectGrid } from "@/components/ProjectGrid"
import { Project } from "@/types/hrms"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from "@/hooks/use-toast"

const Projects = () => {
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
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
    setSelectedProject(null)
    setIsCreateDialogOpen(true)
  }

  const handleProjectEdit = (project: Project) => {
    setSelectedProject(project)
    setIsEditDialogOpen(true)
  }

  const handleProjectView = (project: Project) => {
    setSelectedProject(project)
    setIsViewDialogOpen(true)
  }

  const handleSaveProject = () => {
    if (selectedProject) {
      // Update existing project
      handleProjectUpdate(selectedProject)
      setIsEditDialogOpen(false)
      toast({
        title: "Project Updated",
        description: "Project has been successfully updated.",
      })
    } else {
      // Create new project
      const newProject: Project = {
        id: Date.now().toString(),
        title: "New Project",
        description: "Project description",
        status: "Planning",
        priority: "Medium",
        assignedTo: [],
        dueDate: new Date().toISOString().split('T')[0],
        createdDate: new Date().toISOString().split('T')[0],
        progress: 0,
        department: "General",
        tags: ["new"]
      }
      setProjects([...projects, newProject])
      setIsCreateDialogOpen(false)
      toast({
        title: "Project Created",
        description: "New project has been successfully created.",
      })
    }
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
        onProjectEdit={handleProjectEdit}
        onProjectView={handleProjectView}
      />

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Set up a new project with details, timeline, and team assignments
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" placeholder="Enter project title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter project description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" placeholder="urgent, design, development" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject}>
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Project Title</Label>
              <Input id="editTitle" placeholder="Enter project title" defaultValue={selectedProject?.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDepartment">Department</Label>
              <Select defaultValue={selectedProject?.department.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea id="editDescription" placeholder="Enter project description" defaultValue={selectedProject?.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select defaultValue={selectedProject?.status.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPriority">Priority</Label>
              <Select defaultValue={selectedProject?.priority.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDueDate">Due Date</Label>
              <Input id="editDueDate" type="date" defaultValue={selectedProject?.dueDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editProgress">Progress (%)</Label>
              <Input id="editProgress" type="number" min="0" max="100" defaultValue={selectedProject?.progress} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject}>
              Update Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Project details and information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm">{selectedProject?.status}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <p className="text-sm">{selectedProject?.priority}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <p className="text-sm">{selectedProject?.department}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Progress</Label>
                <p className="text-sm">{selectedProject?.progress}%</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Due Date</Label>
                <p className="text-sm">{selectedProject?.dueDate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{selectedProject?.createdDate}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm mt-1">{selectedProject?.description}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedProject?.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Assigned Team ({selectedProject?.assignedTo.length})</Label>
              <p className="text-sm mt-1">{selectedProject?.assignedTo.join(', ')}</p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              handleProjectEdit(selectedProject!)
            }}>
              Edit Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Projects
