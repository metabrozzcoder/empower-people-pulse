import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Camera, Fingerprint, Lock, AlertTriangle, Shield, Activity, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const DEVICES: Record<string, { name: string; type: string; location: string; ip: string; firmware: string }> = {
  '1': { name: 'Main Entrance Camera', type: 'camera', location: 'Main Entrance', ip: '192.168.1.41', firmware: 'v4.2.1' },
  '2': { name: 'Biometric Scanner - HR', type: 'biometric', location: 'HR Department', ip: '192.168.1.42', firmware: 'v3.1.0' },
  '3': { name: 'Emergency Exit Alarm', type: 'alarm', location: 'Emergency Exit', ip: '192.168.1.43', firmware: 'v2.5.4' },
  '4': { name: 'Server Room Access', type: 'access_control', location: 'Server Room', ip: '192.168.1.44', firmware: 'v5.0.2' },
}

const ICONS: Record<string, any> = { camera: Camera, biometric: Fingerprint, access_control: Lock, alarm: AlertTriangle }

export default function DeviceDetail() {
  const { id = '1' } = useParams()
  const [params] = useSearchParams()
  const initialTab = params.get('tab') === 'config' ? 'config' : 'monitor'
  const navigate = useNavigate()
  const { toast } = useToast()
  const device = DEVICES[id] || DEVICES['1']
  const Icon = ICONS[device.type] || Shield

  const [name, setName] = useState(device.name)
  const [location, setLocation] = useState(device.location)
  const [ip, setIp] = useState(device.ip)
  const [enabled, setEnabled] = useState(true)
  const [motion, setMotion] = useState(true)
  const [recording, setRecording] = useState(true)
  const [sensitivity, setSensitivity] = useState('medium')

  const save = () => {
    toast({ title: 'Configuration saved', description: `${name} settings updated.` })
  }

  const reboot = () => {
    toast({ title: 'Rebooting device', description: `${name} is restarting…` })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/security-system')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{device.name}</h1>
          <p className="text-sm text-muted-foreground">{device.location} · {device.ip} · {device.firmware}</p>
        </div>
        <Badge className="bg-green-100 text-green-800">Online</Badge>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="monitor"><Activity className="w-4 h-4 mr-1" />Live Monitor</TabsTrigger>
          <TabsTrigger value="config"><Shield className="w-4 h-4 mr-1" />Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle>Live View</CardTitle>
              <CardDescription>Realtime stream from device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border">
                <div className="text-center text-muted-foreground">
                  <Icon className="w-12 h-12 mx-auto mb-2" />
                  <p>Live feed simulated</p>
                  <p className="text-xs">Stream: rtsp://{device.ip}/stream1</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border rounded"><p className="text-xs text-muted-foreground">Uptime</p><p className="font-semibold">12d 4h</p></div>
                <div className="p-3 border rounded"><p className="text-xs text-muted-foreground">Events today</p><p className="font-semibold">38</p></div>
                <div className="p-3 border rounded"><p className="text-xs text-muted-foreground">Latency</p><p className="font-semibold">42 ms</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Device Configuration</CardTitle>
              <CardDescription>Update device settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>Device Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                <div><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
                <div><Label>IP Address</Label><Input value={ip} onChange={e => setIp(e.target.value)} /></div>
                <div>
                  <Label>Sensitivity</Label>
                  <Select value={sensitivity} onValueChange={setSensitivity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between"><span>Device Enabled</span><Switch checked={enabled} onCheckedChange={setEnabled} /></div>
                <div className="flex items-center justify-between"><span>Motion Detection</span><Switch checked={motion} onCheckedChange={setMotion} /></div>
                <div className="flex items-center justify-between"><span>Continuous Recording</span><Switch checked={recording} onCheckedChange={setRecording} /></div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={save}><Save className="w-4 h-4 mr-1" />Save Configuration</Button>
                <Button variant="outline" onClick={reboot}>Reboot Device</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
