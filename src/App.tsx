import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/AppSidebar"
import { UserProvider } from "@/context/UserContext"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
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

function AppContent() {
  const { logout, isAuthenticated, currentUser } = useAuth()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 lg:px-6">
              <SidebarTrigger className="mr-2" />
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
              >
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6">
            <Routes>
              <Route path="/" element={<ProtectedRoute sectionName="Dashboard"><Index /></ProtectedRoute>} />
              <Route path="/ai-assistant" element={<ProtectedRoute sectionName="AI Assistant"><AIAssistantPage /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute sectionName="Employees"><Employees /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute sectionName="Projects"><Projects /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              
              {/* Fully functional HR pages */}
              <Route path="/recruitment" element={<ProtectedRoute sectionName="Recruitment"><Recruitment /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute sectionName="Tasks"><Tasks /></ProtectedRoute>} />
              <Route path="/scheduling" element={<ProtectedRoute sectionName="Scheduling"><Scheduling /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute sectionName="Attendance"><Attendance /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute sectionName="Analytics"><Analytics /></ProtectedRoute>} />
              
              {/* Organization & Communication pages */}
              <Route path="/organizations" element={<ProtectedRoute sectionName="Organizations"><Organizations /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute sectionName="Chat"><Chat /></ProtectedRoute>} />
              <Route path="/user-management" element={<ProtectedRoute sectionName="User Management" allowedRoles={['Admin']}><UserManagement /></ProtectedRoute>} />
              <Route path="/access-control" element={<ProtectedRoute sectionName="Access Control" allowedRoles={['Admin']}><AccessControl /></ProtectedRoute>} />
              
              {/* New pages */}
              <Route path="/security-system" element={<ProtectedRoute allowedRoles={['Admin']}><SecuritySystem /></ProtectedRoute>} />
              <Route path="/documentation" element={<ProtectedRoute sectionName="Documentation"><Documentation /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              {/* Placeholder routes for future implementation */}
              <Route path="/communications" element={<ProtectedRoute><div className="text-center py-12"><h2 className="text-2xl font-bold">Communications</h2><p className="text-muted-foreground">Internal communications coming soon...</p></div></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </UserProvider>
  </QueryClientProvider>
)

export default App