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
import { useToast } from "@/hooks/use-toast"
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

const sidebarSections = [
  {
    title: "Main Menu",
    collapsible: false,
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "AI Assistant", url: "/ai-assistant", icon: Brain },
    ]
  },
  {
    title: "HR & Projects",
    collapsible: true,
    items: [
      { title: "Employees", url: "/employees", icon: Users },
      { title: "Recruitment", url: "/recruitment", icon: UserPlus },
      { title: "Scheduling", url: "/scheduling", icon: Calendar },
      { title: "Projects", url: "/projects", icon: Briefcase },
      { title: "Tasks", url: "/tasks", icon: ClipboardList },
    ]
  },
  {
    title: "Organization",
    collapsible: true,
    items: [
      { title: "Organizations", url: "/organizations", icon: Building2 },
    ]
  },
  {
    title: "Communication",
    collapsible: true,
    items: [
      { title: "Chat", url: "/chat", icon: MessageSquare },
    ]
  },
  {
    title: "Management & Analytics",
    collapsible: true,
    items: [
      { title: "User Management", url: "/user-management", icon: UserCheck },
      { title: "Access Control", url: "/access-control", icon: Shield },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "Documentation",
    collapsible: true,
    items: [
      { title: "Documentation", url: "/documentation", icon: FileSearch },
    ]
  },
  {
    title: "System",
    collapsible: true,
    items: [
      { title: "Payroll", url: "/payroll", icon: DollarSign },
      { title: "Automation", url: "/automation", icon: Zap },
      { title: "Security System", url: "/security-system", icon: Scan },
      { title: "Settings", url: "/settings", icon: Settings },
    ]
  }
]

export function AppSidebar() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState<string[]>([
    "Main Menu", "HR & Projects", "Organization"
  ])

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-semibold border-r-4 border-primary shadow-sm" 
      : "text-foreground/70 hover:bg-accent hover:text-accent-foreground transition-all duration-200"

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You have been successfully logged out.",
    })
    navigate("/")
  }

  const handleProfileAction = (action: string) => {
    if (action === 'logout') {
      handleLogout()
    } else if (action === 'settings') {
      navigate("/settings")
    } else if (action === 'profile') {
      navigate("/profile")
    }
  }

  const SidebarSection = ({ section }: { section: typeof sidebarSections[0] }) => (
    <SidebarGroup className="mb-4">
      {section.collapsible ? (
        <Collapsible open={openSections.includes(section.title)} onOpenChange={() => toggleSection(section.title)}>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3 cursor-pointer flex items-center justify-between hover:text-foreground transition-colors">
              {section.title}
              <ChevronDown className={`h-4 w-4 transition-transform ${openSections.includes(section.title) ? 'rotate-180' : ''}`} />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
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
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            {section.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {section.items.map((item) => (
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
    <Sidebar className="border-r shadow-lg bg-background" style={{ minWidth: '280px' }}>
      <SidebarHeader className="p-6 border-b bg-gradient-to-r from-primary to-primary/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-md">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-foreground">
              MediaHR Pro
            </h2>
            <p className="text-primary-foreground/80 text-sm">AI-Enhanced HRM</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 overflow-y-auto">
        {sidebarSections.map((section) => (
          <SidebarSection key={section.title} section={section} />
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-muted/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 p-3 bg-background rounded-lg border shadow-sm cursor-pointer hover:bg-accent transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Sarah Wilson</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Administrator
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleProfileAction('profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleProfileAction('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleProfileAction('logout')}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}