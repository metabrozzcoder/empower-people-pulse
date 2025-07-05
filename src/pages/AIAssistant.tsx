
import { AIAssistant } from "@/components/AIAssistant"

const AIAssistantPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get intelligent insights and automation for your HR processes.
        </p>
      </div>
      
      <AIAssistant />
    </div>
  )
}

export default AIAssistantPage
