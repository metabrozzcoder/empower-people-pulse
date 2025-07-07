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
  UsersIcon,
  ChevronDown,
  LogOut,
  FileSearch,
  Scan
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
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
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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

const organizationItems = [
  { title: "Organizations", url: "/organizations", icon: Building2 },
]

const communicationItems = [
  { title: "Chat", url: "/chat", icon: MessageSquare },
]

const managementAndAnalyticsItems = [
  { title: "User Management", url: "/user-management", icon: UserCheck },
  { title: "Role Management", url: "/role-management", icon: Shield },
  { title: "Access Control", url: "/access-control", icon: Shield },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "KPI Dashboard", url: "/kpi-dashboard", icon: Target },
  { title: "Reports", url: "/reports", icon: FileText },
]

const documentationItems = [
  { title: "Documentation", url: "/documentation", icon: FileSearch },
]

const systemItems = [
  { title: "Payroll", url: "/payroll", icon: DollarSign },
  { title: "Automation", url: "/automation", icon: Zap },
  { title: "Security System", url: "/security-system", icon: Shield },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-blue-100 text-blue-900 font-semibold border-r-4 border-blue-600 shadow-sm" 
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"

  const handleLogout = () => {
    // Implement logout logic here
    console.log("Logging out...")
    navigate("/")
  }

  const SidebarSection = ({ 
    title, 
    items,
    collapsible = false,
    children
  }: { 
    title: string
    items?: any[]
    collapsible?: boolean
    children?: React.ReactNode
  }) => (
    <SidebarGroup className="mb-6">
      {collapsible ? (
        <Collapsible open={openSections.includes(title)} onOpenChange={() => toggleSection(title)}>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-3 cursor-pointer flex items-center justify-between hover:text-gray-800">
              {title}
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes(title) ? 'rotate-180' : ''}`} />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              {children || (
                <SidebarMenu className="space-y-1">
                  {items?.map((item) => (
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
              )}
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <SidebarGroupLabel className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-3">
            {title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items?.map((item) => (
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
        </>
      )}
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
        
        <SidebarSection title="Organization" collapsible>
          <SidebarMenu className="space-y-1">
            {organizationItems.map((item) => (
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
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/departments" 
                  className={({ isActive }) => `${getNavCls({ isActive })} flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-4`}
                >
                  <UsersIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>Departments</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarSection>

        <SidebarSection title="Communication" items={communicationItems} />
        <SidebarSection title="Management & Analytics" items={managementAndAnalyticsItems} />
        <SidebarSection title="Documentation" items={documentationItems} />
        
        <SidebarSection title="System" collapsible>
          <SidebarMenu className="space-y-1">
            {systemItems.map((item) => (
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
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/settings" 
                  className={({ isActive }) => `${getNavCls({ isActive })} flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
                >
                  <Settings className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span>Settings</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarSection>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 bg-gray-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
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
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}