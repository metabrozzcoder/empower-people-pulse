
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
import NotFound from "./pages/NotFound"

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
                  <Route path="/" element={<Index />} />
                  <Route path="/ai-assistant" element={<AIAssistantPage />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/account-settings" element={<AccountSettings />} />
                  
                  {/* Placeholder routes for future implementation */}
                  <Route path="/recruitment" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Recruitment</h2><p className="text-muted-foreground">AI-powered recruitment tools coming soon...</p></div>} />
                  <Route path="/tasks" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Task Management</h2><p className="text-muted-foreground">Advanced task tracking coming soon...</p></div>} />
                  <Route path="/scheduling" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Smart Scheduling</h2><p className="text-muted-foreground">AI-optimized scheduling coming soon...</p></div>} />
                  <Route path="/attendance" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Attendance</h2><p className="text-muted-foreground">Real-time attendance tracking coming soon...</p></div>} />
                  <Route path="/performance" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Performance</h2><p className="text-muted-foreground">Performance analytics coming soon...</p></div>} />
                  <Route path="/analytics" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Analytics</h2><p className="text-muted-foreground">Advanced HR analytics coming soon...</p></div>} />
                  <Route path="/kpi-dashboard" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">KPI Dashboard</h2><p className="text-muted-foreground">KPI tracking coming soon...</p></div>} />
                  <Route path="/payroll" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Payroll</h2><p className="text-muted-foreground">Payroll management coming soon...</p></div>} />
                  <Route path="/communications" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Communications</h2><p className="text-muted-foreground">Internal communications coming soon...</p></div>} />
                  <Route path="/reports" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Reports</h2><p className="text-muted-foreground">Advanced reporting coming soon...</p></div>} />
                  <Route path="/automation" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Automation</h2><p className="text-muted-foreground">Workflow automation coming soon...</p></div>} />
                  <Route path="/access-control" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Access Control</h2><p className="text-muted-foreground">Role-based access control coming soon...</p></div>} />
                  <Route path="/settings" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">System Settings</h2><p className="text-muted-foreground">System configuration coming soon...</p></div>} />
                  
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
