
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"

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
  { title: "Messages", url: "/chat", icon: MessageSquare },
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
    hrManagement: true,
    projects: true,
    organization: true,
    chat: true,
    userManagement: true,
    analytics: true,
    system: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-blue-100 text-blue-900 font-semibold border-r-4 border-blue-600 shadow-sm" 
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"

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
    <div className="mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-3 text-left font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
      >
        <div className="flex items-center space-x-3">
          <SectionIcon className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {openSections[sectionKey] 
          ? <ChevronDown className="h-4 w-4 text-gray-500" />
          : <ChevronRight className="h-4 w-4 text-gray-500" />
        }
      </button>
      
      {openSections[sectionKey] && (
        <div className="mt-2 ml-4 space-y-1">
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink to={item.url} end className={`${getNavCls} flex items-center px-4 py-2 rounded-md text-sm`}>
                    <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      )}
    </div>
  )

  return (
    <Sidebar className="border-r border-gray-200 bg-white shadow-lg" style={{ minWidth: '280px' }}>
      <SidebarHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              MediaHR Pro
            </h2>
            <p className="text-blue-100 text-sm">AI-Enhanced HRM</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 bg-white overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="space-y-2">
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
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Sarah Wilson</p>
            <p className="text-xs text-gray-500 flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
