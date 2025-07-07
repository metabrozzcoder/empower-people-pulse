import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import Index from "./pages/Index"
import Employees from "./pages/Employees"
import Profile from "./pages/Profile"
import AccountSettings from "./pages/AccountSettings"
import AIAssistantPage from "./pages/AIAssistant"
import Projects from "./pages/Projects"
import Recruitment from "./pages/Recruitment"
import Tasks from "./pages/Tasks"
import Scheduling from "./pages/Scheduling"
import Attendance from "./pages/Attendance"
import Analytics from "./pages/Analytics"
import Organizations from "./pages/Organizations"
import Departments from "./pages/Departments"
import Chat from "./pages/Chat"
import UserManagement from "./pages/UserManagement"
import RoleManagement from "./pages/RoleManagement"
import AccessControl from "./pages/AccessControl"
import SecuritySystem from "./pages/SecuritySystem"
import Documentation from "./pages/Documentation"
import Settings from "./pages/Settings"
import NotFound from "./pages/NotFound"
import Login from "./pages/Login"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center px-4 lg:px-6">
                  <SidebarTrigger className="mr-2" />
                  <div className="flex-1" />
                </div>
              </header>
              <main className="flex-1 p-4 lg:p-6">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/ai-assistant" element={<AIAssistantPage />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/account-settings" element={<AccountSettings />} />
                  
                  {/* Fully functional HR pages */}
                  <Route path="/recruitment" element={<Recruitment />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/scheduling" element={<Scheduling />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/analytics" element={<Analytics />} />
                  
                  {/* Organization & Communication pages */}
                  <Route path="/organizations" element={<Organizations />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/access-control" element={<AccessControl />} />
                  
                  {/* New pages */}
                  <Route path="/security-system" element={<SecuritySystem />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Placeholder routes for future implementation */}
                  <Route path="/payroll" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Payroll</h2><p className="text-muted-foreground">Payroll management coming soon...</p></div>} />
                  <Route path="/communications" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Communications</h2><p className="text-muted-foreground">Internal communications coming soon...</p></div>} />
                  
                  <Route path="/automation" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Automation</h2><p className="text-muted-foreground">Workflow automation coming soon...</p></div>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App