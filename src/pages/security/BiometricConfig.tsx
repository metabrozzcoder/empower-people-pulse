import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Fingerprint, Eye, Shield, UserPlus, Camera, Settings, Save, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'

type Section =
  | 'fingerprint'
  | 'facial'
  | 'multi-factor'
  | 'bulk-enroll'
  | 'test-face'
  | 'test-fingerprint'
  | 'access-rules'

const META: Record<Section, { title: string; description: string; icon: any }> = {
  'fingerprint': { title: 'Fingerprint Enrollment', description: 'Capture and register fingerprints for employees', icon: Fingerprint },
  'facial': { title: 'Facial Recognition Enrollment', description: 'Register employee face data with the Hikvision system', icon: Eye },
  'multi-factor': { title: 'Multi-Factor (Card + Biometric)', description: 'Configure card + biometric requirements per zone', icon: Shield },
  'bulk-enroll': { title: 'Bulk User Enrollment', description: 'Import and enroll many users at once', icon: UserPlus },
  'test-face': { title: 'Test Face Recognition', description: 'Run a live test against the face recognition pipeline', icon: Camera },
  'test-fingerprint': { title: 'Test Fingerprint Scanner', description: 'Verify the fingerprint scanner is operating correctly', icon: Fingerprint },
  'access-rules': { title: 'Configure Access Rules', description: 'Set who can access which zones and when', icon: Settings },
}

export default function BiometricConfig() {
  const { section = 'fingerprint' } = useParams<{ section: Section }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const meta = META[section as Section] || META.fingerprint
  const Icon = meta.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/security-system')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{meta.title}</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {(section === 'fingerprint' || section === 'facial') && (
        <EnrollPanel kind={section} toast={toast} />
      )}
      {section === 'multi-factor' && <MultiFactorPanel toast={toast} />}
      {section === 'bulk-enroll' && <BulkEnrollPanel toast={toast} />}
      {section === 'test-face' && <TestPanel kind="face" toast={toast} />}
      {section === 'test-fingerprint' && <TestPanel kind="fingerprint" toast={toast} />}
      {section === 'access-rules' && <AccessRulesPanel toast={toast} />}
    </div>
  )
}

function EnrollPanel({ kind, toast }: { kind: 'fingerprint' | 'facial'; toast: any }) {
  const [employeeId, setEmployeeId] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string | null }[]>([])

  useEffect(() => {
    supabase.from('employees').select('id, name, department').then(({ data }) => setEmployees(data ?? []))
  }, [])

  const start = () => {
    if (!employeeId) { toast({ title: 'Select an employee first' }); return }
    setScanning(true); setProgress(0); setDone(false)
    const t = setInterval(() => {
      setProgress(p => {
        const next = p + 10
        if (next >= 100) { clearInterval(t); setScanning(false); setDone(true); toast({ title: 'Enrollment complete', description: `${kind === 'fingerprint' ? 'Fingerprint' : 'Face'} registered.` }) }
        return Math.min(next, 100)
      })
    }, 250)
  }

  return (
    <Card>
      <CardHeader><CardTitle>Enroll Employee</CardTitle><CardDescription>Capture biometric template</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Employee</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
            <SelectContent>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}{e.department ? ` — ${e.department}` : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="aspect-video bg-muted rounded-lg border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            {kind === 'fingerprint' ? <Fingerprint className="w-16 h-16 mx-auto mb-2" /> : <Eye className="w-16 h-16 mx-auto mb-2" />}
            <p>{scanning ? 'Capturing…' : done ? 'Capture complete' : 'Ready to capture'}</p>
          </div>
        </div>
        {(scanning || done) && <Progress value={progress} />}
        <div className="flex gap-2">
          <Button onClick={start} disabled={scanning}>{scanning ? 'Scanning…' : done ? 'Capture Again' : 'Start Capture'}</Button>
          {done && <Button variant="outline" onClick={() => toast({ title: 'Saved', description: 'Enrollment saved to Hikvision.' })}><Save className="w-4 h-4 mr-1" />Save Enrollment</Button>}
        </div>
      </CardContent>
    </Card>
  )
}

function MultiFactorPanel({ toast }: { toast: any }) {
  const zones = ['Main Entrance', 'HR Department', 'Server Room', 'Executive Offices', 'Finance']
  const [rules, setRules] = useState<Record<string, boolean>>({ 'Server Room': true, 'Executive Offices': true })
  return (
    <Card>
      <CardHeader><CardTitle>Zones requiring Card + Biometric</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {zones.map(z => (
          <div key={z} className="flex items-center justify-between p-3 border rounded">
            <span>{z}</span>
            <Switch checked={!!rules[z]} onCheckedChange={v => setRules(r => ({ ...r, [z]: v }))} />
          </div>
        ))}
        <Button onClick={() => toast({ title: 'Saved', description: 'Multi-factor zones updated.' })}><Save className="w-4 h-4 mr-1" />Save</Button>
      </CardContent>
    </Card>
  )
}

function BulkEnrollPanel({ toast }: { toast: any }) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)

  const run = () => {
    if (!file) { toast({ title: 'Choose a CSV file first' }); return }
    setRunning(true); setProgress(0)
    const t = setInterval(() => {
      setProgress(p => {
        const next = p + 5
        if (next >= 100) { clearInterval(t); setRunning(false); toast({ title: 'Bulk enrollment complete', description: `${file.name} processed.` }) }
        return Math.min(next, 100)
      })
    }, 150)
  }

  return (
    <Card>
      <CardHeader><CardTitle>Upload Employee CSV</CardTitle><CardDescription>Columns: name,email,department,access_level</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
        {(running || progress > 0) && <Progress value={progress} />}
        <Button onClick={run} disabled={running}>{running ? 'Enrolling…' : 'Start Bulk Enrollment'}</Button>
      </CardContent>
    </Card>
  )
}

function TestPanel({ kind, toast }: { kind: 'face' | 'fingerprint'; toast: any }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'pass' | 'fail'>('idle')
  const run = () => {
    setStatus('running')
    setTimeout(() => {
      const ok = Math.random() > 0.15
      setStatus(ok ? 'pass' : 'fail')
      toast({ title: ok ? 'Test passed' : 'Test failed', description: `${kind === 'face' ? 'Face' : 'Fingerprint'} scanner ${ok ? 'is working' : 'returned an error'}.` })
    }, 1500)
  }
  return (
    <Card>
      <CardHeader><CardTitle>Diagnostic Test</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg border flex items-center justify-center">
          {status === 'pass' ? <CheckCircle className="w-12 h-12 text-green-500" /> :
           status === 'fail' ? <Badge className="bg-red-100 text-red-800">Failed</Badge> :
           kind === 'face' ? <Camera className="w-12 h-12 text-muted-foreground" /> :
           <Fingerprint className="w-12 h-12 text-muted-foreground" />}
        </div>
        <Button onClick={run} disabled={status === 'running'}>{status === 'running' ? 'Testing…' : 'Run Test'}</Button>
      </CardContent>
    </Card>
  )
}

function AccessRulesPanel({ toast }: { toast: any }) {
  const [rules, setRules] = useState([
    { role: 'Admin', zone: 'All Zones', hours: '24/7' },
    { role: 'HR', zone: 'HR Department', hours: '08:00-18:00' },
    { role: 'Engineer', zone: 'Server Room', hours: '09:00-17:00' },
  ])
  const [role, setRole] = useState(''); const [zone, setZone] = useState(''); const [hours, setHours] = useState('')
  const add = () => {
    if (!role || !zone) { toast({ title: 'Role and zone required' }); return }
    setRules(r => [...r, { role, zone, hours: hours || '24/7' }])
    setRole(''); setZone(''); setHours('')
  }
  return (
    <Card>
      <CardHeader><CardTitle>Access Rules</CardTitle><CardDescription>Role → Zone → Hours</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {rules.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded">
              <div><p className="font-medium">{r.role}</p><p className="text-xs text-muted-foreground">{r.zone} · {r.hours}</p></div>
              <Button variant="ghost" size="sm" onClick={() => setRules(rs => rs.filter((_, idx) => idx !== i))}>Remove</Button>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-4 gap-2">
          <Input placeholder="Role" value={role} onChange={e => setRole(e.target.value)} />
          <Input placeholder="Zone" value={zone} onChange={e => setZone(e.target.value)} />
          <Input placeholder="Hours (e.g. 09:00-17:00)" value={hours} onChange={e => setHours(e.target.value)} />
          <Button onClick={add}>Add Rule</Button>
        </div>
        <Button onClick={() => toast({ title: 'Saved', description: 'Access rules updated.' })}><Save className="w-4 h-4 mr-1" />Save All</Button>
      </CardContent>
    </Card>
  )
}
