import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Camera, 
  Fingerprint, 
  Eye, 
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Settings,
  Activity,
  UserPlus
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

interface SecurityDevice {
  id: string
  name: string
  type: 'camera' | 'access_control' | 'biometric' | 'alarm'
  status: 'online' | 'offline' | 'maintenance'
  location: string
  lastActivity: string
}

interface AccessLog {
  id: string
  userId: string
  userName: string
  action: 'entry' | 'exit' | 'denied'
  method: 'card' | 'biometric' | 'manual'
  location: string
  timestamp: string
  success: boolean
}

const mockDevices: SecurityDevice[] = [
  {
    id: '1',
    name: 'Main Entrance Camera',
    type: 'camera',
    status: 'online',
    location: 'Main Entrance',
    lastActivity: '2 minutes ago'
  },
  {
    id: '2',
    name: 'Biometric Scanner - HR',
    type: 'biometric',
    status: 'online',
    location: 'HR Department',
    lastActivity: '5 minutes ago'
  },
  {
    id: '3',
    name: 'Emergency Exit Alarm',
    type: 'alarm',
    status: 'online',
    location: 'Emergency Exit',
    lastActivity: '1 hour ago'
  },
  {
    id: '4',
    name: 'Server Room Access',
    type: 'access_control',
    status: 'maintenance',
    location: 'Server Room',
    lastActivity: '3 hours ago'
  }
]

const mockAccessLogs: AccessLog[] = [
  {
    id: '1',
    userId: 'emp001',
    userName: 'Sarah Wilson',
    action: 'entry',
    method: 'biometric',
    location: 'Main Entrance',
    timestamp: '2024-01-15T08:30:00Z',
    success: true
  },
  {
    id: '2',
    userId: 'emp002',
    userName: 'John Smith',
    action: 'entry',
    method: 'card',
    location: 'HR Department',
    timestamp: '2024-01-15T08:25:00Z',
    success: true
  },
  {
    id: '3',
    userId: 'unknown',
    userName: 'Unknown User',
    action: 'denied',
    method: 'biometric',
    location: 'Server Room',
    timestamp: '2024-01-15T08:20:00Z',
    success: false
  }
]

export default function SecuritySystem() {
  const { toast } = useToast()
  const [devices, setDevices] = useState<SecurityDevice[]>(mockDevices)
  const [accessLogs] = useState<AccessLog[]>(mockAccessLogs)
  const [systemArmed, setSystemArmed] = useState(true)

  const getDeviceIcon = (type: SecurityDevice['type']) => {
    switch (type) {
      case 'camera': return Camera
      case 'biometric': return Fingerprint
      case 'access_control': return Lock
      case 'alarm': return AlertTriangle
      default: return Shield
    }
  }

  const getStatusColor = (status: SecurityDevice['status']) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'offline': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionColor = (action: AccessLog['action'], success: boolean) => {
    if (!success) return 'bg-red-100 text-red-800'
    switch (action) {
      case 'entry': return 'bg-green-100 text-green-800'
      case 'exit': return 'bg-blue-100 text-blue-800'
      case 'denied': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleSystemArmed = () => {
    setSystemArmed(!systemArmed)
    toast({
      title: systemArmed ? "System Disarmed" : "System Armed",
      description: `Security system has been ${systemArmed ? 'disarmed' : 'armed'}.`,
    })
  }

  const onlineDevices = devices.filter(d => d.status === 'online').length
  const offlineDevices = devices.filter(d => d.status === 'offline').length
  const maintenanceDevices = devices.filter(d => d.status === 'maintenance').length
  const successfulAccess = accessLogs.filter(log => log.success).length
  const deniedAccess = accessLogs.filter(log => !log.success).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security System</h1>
          <p className="text-muted-foreground">Monitor and manage building security and access control</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">System Status:</span>
            <Badge variant={systemArmed ? 'default' : 'secondary'}>
              {systemArmed ? 'Armed' : 'Disarmed'}
            </Badge>
          </div>
          <Button
            variant={systemArmed ? 'destructive' : 'default'}
            onClick={toggleSystemArmed}
            className="flex items-center space-x-2"
          >
            {systemArmed ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{systemArmed ? 'Disarm' : 'Arm'} System</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{onlineDevices}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{offlineDevices}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Settings className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{maintenanceDevices}</p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round((onlineDevices / devices.length) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
          <TabsTrigger value="biometric">Biometric</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall security system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Online Devices</span>
                    <span>{onlineDevices}/{devices.length}</span>
                  </div>
                  <Progress value={(onlineDevices / devices.length) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>System Uptime</span>
                    <span>99.8%</span>
                  </div>
                  <Progress value={99.8} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Security Score</span>
                    <span>95/100</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accessLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getActionColor(log.action, log.success)}>
                          {log.action}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Devices</CardTitle>
              <CardDescription>Monitor and manage all security devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.type)
                  return (
                    <Card key={device.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <DeviceIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{device.name}</h3>
                              <p className="text-sm text-muted-foreground">{device.location}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(device.status)}>
                            {device.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Type:</span>
                            <span className="capitalize">{device.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last Activity:</span>
                            <span>{device.lastActivity}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="w-4 h-4 mr-1" />
                            Config
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
              <CardDescription>View all access attempts and security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{log.userName}</h3>
                          <Badge className={getActionColor(log.action, log.success)}>
                            {log.action}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Location: {log.location}</span>
                          <span>Method: {log.method}</span>
                          <span>Time: {new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {log.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biometric" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biometric Access Control - Hikvision Integration</CardTitle>
              <CardDescription>Manage biometric authentication and enrollment with Hikvision system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Fingerprint className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Fingerprint Scanner</h3>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-sm text-muted-foreground">Enrolled Users</p>
                    <Button className="mt-3" size="sm">
                      Enroll New
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Eye className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Facial Recognition</h3>
                    <p className="text-2xl font-bold">89</p>
                    <p className="text-sm text-muted-foreground">Enrolled Users</p>
                    <Button className="mt-3" size="sm">
                      Enroll New
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Shield className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Card + Biometric</h3>
                    <p className="text-2xl font-bold">45</p>
                    <p className="text-sm text-muted-foreground">Multi-Factor Users</p>
                    <Button className="mt-3" size="sm">
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Hikvision System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Main Controller</span>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Entrance Scanner</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Exit Scanner</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>HR Department Scanner</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
                    </div>
                    <Button className="w-full mt-4">
                      Sync with Hikvision System
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Bulk User Enrollment
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Test Face Recognition
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Test Fingerprint Scanner
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Access Rules
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Biometric Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require Biometric for High-Security Areas</p>
                      <p className="text-sm text-muted-foreground">Server room, executive offices</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Multi-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Card + Biometric for sensitive areas</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Lock After Hours</p>
                      <p className="text-sm text-muted-foreground">Automatically lock all doors after business hours</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Emergency Override</p>
                      <p className="text-sm text-muted-foreground">Allow manual override in emergencies</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure system-wide security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">General Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-Lock Doors</p>
                      <p className="text-sm text-muted-foreground">Automatically lock doors after hours</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Motion Detection</p>
                      <p className="text-sm text-muted-foreground">Enable motion detection on cameras</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}