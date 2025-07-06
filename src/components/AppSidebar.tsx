
import { 
  Users, 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Settings,
  User,
  TrendingUp,
  Clock,
  Briefcase,
  UserPlus,
  ClipboardList,
  BarChart3,
  MessageSquare,
  Brain,
  Target,
  DollarSign,
  Shield,
  Zap,
  Building2,
  Phone,
  Video,
  Mic,
  Image,
  FileIcon,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UsersIcon
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const mainNavigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "AI Assistant", url: "/ai-assistant", icon: Brain },
]

const hrManagementItems = [
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Recruitment", url: "/recruitment", icon: UserPlus },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Attendance", url: "/attendance", icon: Clock },
  { title: "Scheduling", url: "/scheduling", icon: Calendar },
]

const projectItems = [
  { title: "Projects", url: "/projects", icon: Briefcase },
  { title: "Tasks", url: "/tasks", icon: ClipboardList },
]

const organizationItems = [
  { title: "Organizations", url: "/organizations", icon: Building2 },
  { title: "Departments", url: "/departments", icon: UsersIcon },
]

const chatItems = [
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Voice Calls", url: "/voice-calls", icon: Phone },
  { title: "Video Calls", url: "/video-calls", icon: Video },
  { title: "File Sharing", url: "/file-sharing", icon: FileIcon },
]

const userManagementItems = [
  { title: "User Management", url: "/user-management", icon: UserCheck },
  { title: "Role Management", url: "/role-management", icon: Shield },
  { title: "Access Control", url: "/access-control", icon: Shield },
]

const analyticsItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "KPI Dashboard", url: "/kpi-dashboard", icon: Target },
  { title: "Reports", url: "/reports", icon: FileText },
]

const systemItems = [
  { title: "Payroll", url: "/payroll", icon: DollarSign },
  { title: "Automation", url: "/automation", icon: Zap },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  const [openSections, setOpenSections] = useState({
    main: true,
    hrManagement: false,
    projects: false,
    organization: false,
    chat: false,
    userManagement: false,
    analytics: false,
    system: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-accent hover:text-accent-foreground transition-colors"

  const SidebarSection = ({ 
    title, 
    items, 
    sectionKey, 
    icon: SectionIcon 
  }: { 
    title: string
    items: any[]
    sectionKey: keyof typeof openSections
    icon: any
  }) => (
    <Collapsible open={openSections[sectionKey]} onOpenChange={() => toggleSection(sectionKey)}>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton 
          className="w-full justify-between hover:bg-accent/50 data-[state=open]:bg-accent"
          tooltip={isCollapsed ? title : undefined}
        >
          <div className="flex items-center space-x-2">
            <SectionIcon className="h-4 w-4" />
            <span>{title}</span>
          </div>
          {!isCollapsed && (
            openSections[sectionKey] 
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />
          )}
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        <SidebarMenu className="ml-4 border-l border-border/50">
          {items.map((item) => (
            <SidebarMenuItem key={item.title} className="ml-2">
              <SidebarMenuButton asChild tooltip={isCollapsed ? item.title : undefined}>
                <NavLink to={item.url} end className={getNavCls}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  )

  return (
    <Sidebar collapsible="icon" className="border-r bg-gradient-to-b from-background to-accent/20">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              MediaHR Pro
            </h2>
            <p className="text-xs text-muted-foreground">AI-Enhanced HRM</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarSection 
                title="Main Menu" 
                items={mainNavigationItems} 
                sectionKey="main" 
                icon={LayoutDashboard}
              />
              <SidebarSection 
                title="HR Management" 
                items={hrManagementItems} 
                sectionKey="hrManagement" 
                icon={Users}
              />
              <SidebarSection 
                title="Projects & Tasks" 
                items={projectItems} 
                sectionKey="projects" 
                icon={Briefcase}
              />
              <SidebarSection 
                title="Organization" 
                items={organizationItems} 
                sectionKey="organization" 
                icon={Building2}
              />
              <SidebarSection 
                title="Chat" 
                items={chatItems} 
                sectionKey="chat" 
                icon={MessageSquare}
              />
              <SidebarSection 
                title="User Management" 
                items={userManagementItems} 
                sectionKey="userManagement" 
                icon={UserCheck}
              />
              <SidebarSection 
                title="Analytics & Reports" 
                items={analyticsItems} 
                sectionKey="analytics" 
                icon={BarChart3}
              />
              <SidebarSection 
                title="System" 
                items={systemItems} 
                sectionKey="system" 
                icon={Settings}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-accent/30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium">Sarah Wilson</p>
            <p className="text-xs text-muted-foreground flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
