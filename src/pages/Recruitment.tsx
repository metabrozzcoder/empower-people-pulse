
import React from 'react'
import { RecruitmentEnhanced } from "@/components/RecruitmentEnhanced"
import { useToast } from "@/hooks/use-toast"

const Recruitment = () => {
  const { toast } = useToast()

  const handleCandidateAction = (action: string, candidateId: string) => {
    console.log(`Candidate action: ${action} for ${candidateId}`)
  }

  const handleJobAction = (action: string, jobId: string) => {
    console.log(`Job action: ${action} for ${jobId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Recruitment</h1>
        <p className="text-muted-foreground">
          Streamline your hiring process with intelligent candidate screening and comprehensive management.
        </p>
      </div>

      <RecruitmentEnhanced 
        onCandidateAction={handleCandidateAction}
        onJobAction={handleJobAction}
      />
    </div>
  )
}

export default Recruitment
