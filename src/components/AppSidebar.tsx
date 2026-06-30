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
  Scan,
  Camera,
  Car
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/AuthContext"
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
    titleKey: "sidebar.groups.main",
    collapsible: false,
    items: [
      { title: "Dashboard", titleKey: "sidebar.items.dashboard", url: "/", icon: LayoutDashboard, sectionName: "Dashboard" },
      { title: "Shooting Requests", titleKey: "sidebar.items.shootingRequests", url: "/shooting-requests", icon: Camera, sectionName: "Shooting Requests" },
    ]
  },
  {
    title: "HR & Projects",
    titleKey: "sidebar.groups.hr",
    collapsible: true,
    items: [
      { title: "Employees", titleKey: "sidebar.items.employees", url: "/employees", icon: Users, sectionName: "Employees" },
      { title: "Recruitment", titleKey: "sidebar.items.recruitment", url: "/recruitment", icon: UserPlus, sectionName: "Recruitment" },
      { title: "Scheduling", titleKey: "sidebar.items.scheduling", url: "/scheduling", icon: Calendar, sectionName: "Scheduling" },
      { title: "Projects", titleKey: "sidebar.items.projects", url: "/projects", icon: Briefcase, sectionName: "Projects" },
      { title: "Tasks", titleKey: "sidebar.items.tasks", url: "/tasks", icon: ClipboardList, sectionName: "Tasks" },
    ]
  },
  {
    title: "Organization",
    titleKey: "sidebar.groups.organization",
    collapsible: true,
    items: [
      { title: "Organizations", titleKey: "sidebar.items.organizations", url: "/organizations", icon: Building2, sectionName: "Organizations" },
    ]
  },
  {
    title: "Communication",
    titleKey: "sidebar.groups.communication",
    collapsible: true,
    items: [
      { title: "Chat", titleKey: "sidebar.items.chat", url: "/chat", icon: MessageSquare, sectionName: "Chat" },
    ]
  },
  {
    title: "Management & Analytics",
    titleKey: "sidebar.groups.analytics",
    collapsible: true,
    items: [
      { title: "User Management", titleKey: "sidebar.items.userManagement", url: "/user-management", icon: UserCheck, sectionName: "User Management", allowedRoles: ["Admin"] },
      { title: "Access Control", titleKey: "sidebar.items.accessControl", url: "/access-control", icon: Shield, sectionName: "Access Control", allowedRoles: ["Admin"] },
      { title: "Role Management", titleKey: "sidebar.items.roleManagement", url: "/role-management", icon: Shield, sectionName: "Role Management", allowedRoles: ["Admin"] },
      { title: "Analytics", titleKey: "sidebar.items.analytics", url: "/analytics", icon: BarChart3, sectionName: "Analytics" },
    ]
  },
  {
    title: "Finance",
    titleKey: "sidebar.groups.finance",
    collapsible: true,
    items: [
      { title: "Payment Commission", titleKey: "sidebar.items.paymentCommission", url: "/payment-commission", icon: DollarSign, sectionName: "Payment Commission" },
    ]
  },
  {
    title: "Drivers & Garage",
    titleKey: "sidebar.groups.garage",
    collapsible: true,
    items: [
      { title: "Garage", titleKey: "sidebar.items.garage", url: "/garage", icon: Car, sectionName: "Garage" },
    ]
  },
  {
    title: "Documentation",
    titleKey: "sidebar.groups.documentation",
    collapsible: true,
    items: [
      { title: "Documentation", titleKey: "sidebar.items.documentation", url: "/documentation", icon: FileSearch, sectionName: "Documentation" },
    ]
  },
  {
    title: "AI Assistant",
    titleKey: "sidebar.groups.assistant",
    collapsible: true,
    items: [
      { title: "Assistant", titleKey: "sidebar.items.assistant", url: "/assistant", icon: Brain, sectionName: "Assistant" },
    ]
  },
  {
    title: "System",
    titleKey: "sidebar.groups.system",
    collapsible: true,
    items: [
      { title: "Security System", titleKey: "sidebar.items.securitySystem", url: "/security-system", icon: Scan, allowedRoles: ["Admin"] },
    ]
  }
]

export function AppSidebar() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { logout, currentUser } = useAuth()
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
    logout()
    navigate("/login")
  }

  const handleProfileAction = (action: string) => {
    if (action === 'logout') {
      handleLogout()
    } else if (action === 'settings') {
      navigate("/account-settings")
    } else if (action === 'profile') {
      navigate("/profile")
    }
  }

  // Filter items based on user restrictions and role permissions
  const isItemAccessible = (item: any) => {
    // Admins always see everything
    if (currentUser?.role === 'Admin') return true

    // If the user has an explicit allowed-sections list, restrict strictly to it
    if (currentUser?.allowedSections && currentUser.allowedSections.length > 0) {
      return item.sectionName ? currentUser.allowedSections.includes(item.sectionName) : false
    }

    // Guests without explicit permissions: only Chat
    if (currentUser?.role === 'Guest') {
      return item.sectionName === 'Chat'
    }

    // Check section restrictions (blocked sections)
    if (item.sectionName && currentUser?.sectionAccess?.includes(item.sectionName)) {
      return false
    }

    // Check role restrictions
    if (item.allowedRoles && !item.allowedRoles.includes(currentUser?.role)) {
      return false
    }

    return true
  }

  const filterSectionItems = (section: any) => {
    const filteredItems = section.items.filter(isItemAccessible)
    return {
      ...section,
      items: filteredItems
    }
  }

  const filteredSections = sidebarSections.map(filterSectionItems).filter(section => section.items.length > 0)

  const SidebarSection = ({ section }: { section: typeof sidebarSections[0] }) => (
    <SidebarGroup className="mb-4">
      {section.collapsible ? (
        <Collapsible open={openSections.includes(section.title)} onOpenChange={() => toggleSection(section.title)}>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3 cursor-pointer flex items-center justify-between hover:text-foreground transition-colors">
              {t((section as any).titleKey) as string}
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
                        <span>{t((item as any).titleKey) as string}</span>
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
            {t((section as any).titleKey) as string}
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
                      <span>{t((item as any).titleKey) as string}</span>
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
              ARK
            </h2>
            <p className="text-primary-foreground/80 text-sm">AI-Enhanced HRM</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 overflow-y-auto">
        {filteredSections.map((section) => (
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
                <p className="text-sm font-semibold">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  {currentUser?.role || 'User'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleProfileAction('profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>{t('common.profile')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleProfileAction('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('common.accountSettings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleProfileAction('logout')}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('common.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}