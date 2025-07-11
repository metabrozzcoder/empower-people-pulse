import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge' 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Camera, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  User,
  User,
  MapPin,
  Truck,
  Settings,
  FileText,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Car,
  Package,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast' 
import { useAuth } from '@/context/AuthContext'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ShootingRequest {
  id: string
  projectTitle: string
  shootingDate: string
  mainLocation: string
  extraLocations: ExtraLocation[]
  numberOfCameramen: number
  notes?: string
  initiatorId: string
  reporterId: string
  status: 'Draft' | 'Submitted' | 'Admin Approved' | 'Equipment Assigned' | 'Trip Started' | 'Trip Returned' | 'Equipment Returned' | 'Finished' | 'Rejected'
  driverId?: string
  equipmentAssigned?: boolean
  equipmentReturned?: boolean
  tripStatus?: 'Not Started' | 'Started' | 'Arrived' | 'Waiting' | 'Returning' | 'Returned'
  createdAt: string
  updatedAt: string
}

interface ExtraLocation {
  id: string
  name: string
  approved: boolean
}

interface ShootingRequestUser {
  id: string
  name: string
  position: string
  avatar?: string
}

interface Vehicle {
  id: string
  name: string
  licensePlate: string
  driverId: string
}

interface Equipment {
  id: string
  name: string
  type: string
  status: 'Available' | 'Assigned' | 'Maintenance'
}

// Mock data
const mockUsers: ShootingRequestUser[] = [
  { id: '1', name: 'Sarah Wilson', position: 'Head of Reporters', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b25d0a63?w=80&h=80&fit=crop&crop=face' },
  { id: '2', name: 'John Smith', position: 'Admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face' },
  { id: '3', name: 'Emily Davis', position: 'Reporter', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face' },
  { id: '4', name: 'Michael Chen', position: 'Driver', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
  { id: '5', name: 'Lisa Thompson', position: 'Equipment Department', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face' },
  { id: '6', name: 'Robert Davis', position: 'Reporter', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
  { id: '7', name: 'Alex Johnson', position: 'Initiator', avatar: 'https://images.unsplash.com/photo-1507101105822-7472b28e22ac?w=80&h=80&fit=crop&crop=face' }
]

const mockVehicles: Vehicle[] = [
  { id: '1', name: 'Toyota Hiace', licensePlate: 'ABC-123', driverId: '4' },
  { id: '2', name: 'Ford Transit', licensePlate: 'XYZ-789', driverId: '8' },
  { id: '3', name: 'Mercedes Sprinter', licensePlate: 'DEF-456', driverId: '9' }
]

const mockEquipment: Equipment[] = [
  { id: '1', name: 'Sony FS7', type: 'Camera', status: 'Available' },
  { id: '2', name: 'Canon C300', type: 'Camera', status: 'Available' },
  { id: '3', name: 'Sennheiser Wireless Mic', type: 'Audio', status: 'Available' },
  { id: '4', name: 'Aputure 300D', type: 'Lighting', status: 'Available' },
  { id: '5', name: 'DJI Ronin', type: 'Stabilizer', status: 'Available' }
]

const mockRequests: ShootingRequest[] = [
  {
    id: '1',
    projectTitle: 'Downtown Market Feature',
    shootingDate: '2024-01-20',
    mainLocation: 'Central Market, Downtown',
    extraLocations: [
      { id: '1', name: 'City Hall', approved: true },
      { id: '2', name: 'Riverside Park', approved: false }
    ],
    numberOfCameramen: 2,
    notes: 'Focus on local vendors and customers',
    initiatorId: '7',
    reporterId: '3',
    status: 'Admin Approved',
    driverId: '4',
    equipmentAssigned: true,
    equipmentReturned: false,
    tripStatus: 'Not Started',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    id: '2',
    projectTitle: 'Tech Conference Coverage',
    shootingDate: '2024-01-25',
    mainLocation: 'Convention Center',
    extraLocations: [],
    numberOfCameramen: 3,
    notes: 'Interview with keynote speakers required',
    initiatorId: '7',
    reporterId: '6',
    status: 'Submitted',
    createdAt: '2024-01-16T09:15:00Z',
    updatedAt: '2024-01-16T09:15:00Z'
  },
  {
    id: '3',
    projectTitle: 'Local Sports Tournament',
    shootingDate: '2024-01-18',
    mainLocation: 'City Stadium',
    extraLocations: [
      { id: '3', name: 'Training Grounds', approved: true }
    ],
    numberOfCameramen: 2,
    notes: 'Capture highlights and post-game interviews',
    initiatorId: '7',
    reporterId: '3',
    status: 'Draft',
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T15:45:00Z'
  }
]

export default function ShootingRequests() {
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState<ShootingRequest[]>(mockRequests)
  const [selectedRequest, setSelectedRequest] = useState<ShootingRequest | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInitiator, setSelectedInitiator] = useState('')
  
  // Get current user's job position
  const userPosition = currentUser?.position || 'Reporter'
  
  // Filter requests based on job position and tab
  const getFilteredRequests = () => {
    let filtered = [...requests]
    
    // Filter by status if selected
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }
    
    // Filter by tab
    if (activeTab === 'my') {
      if (userPosition === 'Reporter') {
        filtered = filtered.filter(r => r.reporterId === currentUser?.id)
      } else if (userPosition === 'Driver') {
        filtered = filtered.filter(r => r.driverId === currentUser?.id)
      } else if (userPosition === 'Initiator') {
        filtered = filtered.filter(r => r.initiatorId === currentUser?.id)
      }
    } else if (activeTab === 'pending') {
      if (userPosition === 'Admin' || userPosition === 'Head of Reporters') {
        filtered = filtered.filter(r => r.status === 'Submitted')
      } else if (userPosition === 'Equipment Department') {
        filtered = filtered.filter(r => 
          r.status === 'Admin Approved' || 
          r.status === 'Trip Returned'
        )
      } else if (userPosition === 'Driver') {
        filtered = filtered.filter(r => 
          r.status === 'Equipment Assigned' && 
          r.driverId === currentUser?.id
        )
      } else if (userPosition === 'Reporter') {
        filtered = filtered.filter(r => 
          r.status === 'Equipment Returned' && 
          r.reporterId === currentUser?.id
        )
      }
    }
    
    return filtered
  }
  
  const getStatusColor = (status: ShootingRequest['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Submitted': return 'bg-blue-100 text-blue-800'
      case 'Admin Approved': return 'bg-green-100 text-green-800'
      case 'Equipment Assigned': return 'bg-purple-100 text-purple-800'
      case 'Trip Started': return 'bg-yellow-100 text-yellow-800'
      case 'Trip Returned': return 'bg-indigo-100 text-indigo-800'
      case 'Equipment Returned': return 'bg-teal-100 text-teal-800'
      case 'Finished': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const handleCreateRequest = () => {
    toast({
      title: "Request Created",
      description: "Your shooting request has been created successfully.",
    })
    setIsCreateDialogOpen(false)
  }
  
  const handleViewRequest = (request: ShootingRequest) => {
    setSelectedRequest(request)
    setIsViewDialogOpen(true)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shooting Requests</h1>
          <p className="text-muted-foreground">Manage shooting requests, equipment, and trips</p>
        </div>
        {(userPosition === 'Reporter') && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="my">My Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending Action</TabsTrigger>
          </TabsList>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Admin Approved">Admin Approved</SelectItem>
              <SelectItem value="Equipment Assigned">Equipment Assigned</SelectItem>
              <SelectItem value="Trip Started">Trip Started</SelectItem>
              <SelectItem value="Trip Returned">Trip Returned</SelectItem>
              <SelectItem value="Equipment Returned">Equipment Returned</SelectItem>
              <SelectItem value="Finished">Finished</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Shooting Requests</CardTitle>
              <CardDescription>View and manage all shooting requests in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredRequests().length > 0 ? (
                <div className="space-y-4">
                  {getFilteredRequests().map((request) => (
                    <div 
                      key={request.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleViewRequest(request)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.projectTitle}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(request.shootingDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {request.mainLocation}
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {request.numberOfCameramen} cameramen
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No shooting requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="my" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Shooting Requests</CardTitle>
              <CardDescription>View and manage your shooting requests</CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredRequests().length > 0 ? (
                <div className="space-y-4">
                  {getFilteredRequests().map((request) => (
                    <div 
                      key={request.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleViewRequest(request)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.projectTitle}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(request.shootingDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {request.mainLocation}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No shooting requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Action</CardTitle>
              <CardDescription>Requests that require your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredRequests().length > 0 ? (
                <div className="space-y-4">
                  {getFilteredRequests().map((request) => (
                    <div 
                      key={request.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleViewRequest(request)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.projectTitle}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(request.shootingDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {request.mainLocation}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {userPosition === 'Admin' && request.status === 'Submitted' && (
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending actions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Shooting Request</DialogTitle>
            <DialogDescription>Fill in the details for your shooting request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">Project Title</Label>
              <Input id="projectTitle" placeholder="Enter project title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shootingDate">Shooting Date</Label>
              <Input id="shootingDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainLocation">Main Location</Label>
              <Input id="mainLocation" placeholder="Enter main location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cameramen">Number of Cameramen</Label>
              <Select defaultValue="1">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="initiator">Initiator</Label>
              <Select value={selectedInitiator} onValueChange={setSelectedInitiator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select initiator" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers
                    .filter(user => user.position === 'Initiator')
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="Enter any additional notes" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRequest}>
                Create Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* View Request Dialog */}
      {selectedRequest && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedRequest.projectTitle}</DialogTitle>
              <DialogDescription>
                Shooting request details and actions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Status */}
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(selectedRequest.createdAt).toLocaleString()}
                </div>
              </div>
              
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shooting Date</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{new Date(selectedRequest.shootingDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Main Location</Label>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedRequest.mainLocation}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Number of Cameramen</Label>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedRequest.numberOfCameramen}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reporter</Label>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{mockUsers.find(u => u.id === selectedRequest.reporterId)?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              {/* Extra Locations */}
              {selectedRequest.extraLocations.length > 0 && (
                <div className="space-y-2">
                  <Label>Extra Locations</Label>
                  <div className="space-y-2">
                    {selectedRequest.extraLocations.map(location => (
                      <div key={location.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{location.name}</span>
                        </div>
                        <Badge variant={location.approved ? 'default' : 'outline'}>
                          {location.approved ? 'Approved' : 'Pending Approval'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {selectedRequest.notes && (
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons based on user position and request status */}
              <div className="flex justify-end space-x-2">
                {userPosition === 'Reporter' && selectedRequest.status === 'Draft' && (
                  <Button>Submit Request</Button>
                )}
                
                {userPosition === 'Reporter' && selectedRequest.status === 'Equipment Returned' && (
                  <Button>Finalize Request</Button>
                )}
                
                {userPosition === 'Admin' && selectedRequest.status === 'Submitted' && (
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-red-50 text-red-600 border-red-200">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button className="bg-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve & Assign Driver
                    </Button>
                  </div>
                )}
                
                {userPosition === 'Equipment Department' && selectedRequest.status === 'Admin Approved' && (
                  <Button>Assign Equipment</Button>
                )}
                
                {userPosition === 'Equipment Department' && selectedRequest.status === 'Trip Returned' && (
                  <Button>Confirm Equipment Return</Button>
                )}
                
                {userPosition === 'Driver' && selectedRequest.status === 'Equipment Assigned' && (
                  <Button>Update Trip Status</Button>
                )}
                
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}