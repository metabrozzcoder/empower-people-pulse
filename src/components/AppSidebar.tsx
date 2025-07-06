
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
  FileIcon,
  UserCheck,
  UsersIcon
} from "lucide-react"
import { NavLink } from "react-router-dom"
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
} from "@/components/ui/sidebar"

const mainNavigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "AI Assistant", url: "/ai-assistant", icon: Brain },
]

const hrAndProjectItems = [
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Recruitment", url: "/recruitment", icon: UserPlus },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Attendance", url: "/attendance", icon: Clock },
  { title: "Scheduling", url: "/scheduling", icon: Calendar },
  { title: "Projects", url: "/projects", icon: Briefcase },
  { title: "Tasks", url: "/tasks", icon: ClipboardList },
]

const organizationAndCommunicationItems = [
  { title: "Organizations", url: "/organizations", icon: Building2 },
  { title: "Departments", url: "/departments", icon: UsersIcon },
  { title: "Messages", url: "/chat", icon: MessageSquare },
  { title: "Voice Calls", url: "/voice-calls", icon: Phone },
  { title: "Video Calls", url: "/video-calls", icon: Video },
  { title: "File Sharing", url: "/file-sharing", icon: FileIcon },
]

const managementAndAnalyticsItems = [
  { title: "User Management", url: "/user-management", icon: UserCheck },
  { title: "Role Management", url: "/role-management", icon: Shield },
  { title: "Access Control", url: "/access-control", icon: Shield },
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
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-blue-100 text-blue-900 font-semibold border-r-4 border-blue-600 shadow-sm" 
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"

  const SidebarSection = ({ 
    title, 
    items
  }: { 
    title: string
    items: any[]
  }) => (
    <SidebarGroup className="mb-6">
      <SidebarGroupLabel className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-3">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  end 
                  className={({ isActive }) => `${getNavCls({ isActive })} flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
                >
                  <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
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
        <SidebarSection title="Main Menu" items={mainNavigationItems} />
        <SidebarSection title="HR & Projects" items={hrAndProjectItems} />
        <SidebarSection title="Organization & Communication" items={organizationAndCommunicationItems} />
        <SidebarSection title="Management & Analytics" items={managementAndAnalyticsItems} />
        <SidebarSection title="System" items={systemItems} />
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
