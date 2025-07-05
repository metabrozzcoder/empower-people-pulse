
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import Index from "./pages/Index"
import Employees from "./pages/Employees"
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
                  <Route path="/employees" element={<Employees />} />
                  {/* Placeholder routes */}
                  <Route path="/attendance" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Attendance</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
                  <Route path="/performance" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Performance</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
                  <Route path="/calendar" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Calendar</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
                  <Route path="/reports" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Reports</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
                  <Route path="/profile" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Profile</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
                  <Route path="/settings" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground">Coming soon...</p></div>} />
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
