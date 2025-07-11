import React, { useState, useEffect } from 'react'
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
  UserIcon, 
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
  MoreHorizontal,
  Map
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
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'

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
  assignedEquipment?: string[]
  currentLocation?: { lat: number, lng: number }
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
  currentLocation?: { lat: number, lng: number }
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
  { id: '7', name: 'Alex Johnson', position: 'Initiator', avatar: 'https://images.unsplash.com/photo-1507101105822-7472b28e22ac?w=80&h=80&fit=crop&crop=face' },
  { id: '8', name: 'James Wilson', position: 'Operator', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop&crop=face' },
  { id: '9', name: 'Maria Garcia', position: 'Operator', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face' },
  { id: '10', name: 'David Lee', position: 'Operator', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' }
]

const mockVehicles: Vehicle[] = [
  { 
    id: '1', 
    name: 'Toyota Hiace', 
    licensePlate: 'ABC-123', 
    driverId: '4',
    currentLocation: { lat: 37.7749, lng: -122.4194 } // San Francisco
  },
  { 
    id: '2', 
    name: 'Ford Transit', 
    licensePlate: 'XYZ-789', 
    driverId: '8',
    currentLocation: { lat: 37.3382, lng: -121.8863 } // San Jose
  },
  { 
    id: '3', 
    name: 'Mercedes Sprinter', 
    licensePlate: 'DEF-456', 
    driverId: '9',
    currentLocation: { lat: 37.4419, lng: -122.1430 } // Palo Alto
  }
]

const mockEquipment: Equipment[] = [
  { id: '1', name: 'Sony FS7', type: 'Camera', status: 'Available' },
  { id: '2', name: 'Canon C300', type: 'Camera', status: 'Available' },
  { id: '3', name: 'Sennheiser Wireless Mic', type: 'Audio', status: 'Available' },
  { id: '4', name: 'Aputure 300D', type: 'Lighting', status: 'Available' },
  { id: '5', name: 'DJI Ronin', type: 'Stabilizer', status: 'Available' },
  { id: '6', name: 'Sony A7S III', type: 'Camera', status: 'Assigned' },
  { id: '7', name: 'Rode NTG4+', type: 'Audio', status: 'Assigned' },
  { id: '8', name: 'Litepanels Astra', type: 'Lighting', status: 'Maintenance' },
  { id: '9', name: 'DJI Mavic 3', type: 'Drone', status: 'Available' },
  { id: '10', name: 'Atomos Ninja V', type: 'Monitor/Recorder', status: 'Available' }
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
    updatedAt: '2024-01-16T14:20:00Z',
    assignedEquipment: ['6', '7'],
    currentLocation: { lat: 37.7749, lng: -122.4194 }
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
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false)
  const [isAssignEquipmentDialogOpen, setIsAssignEquipmentDialogOpen] = useState(false)
  const [isGpsDialogOpen, setIsGpsDialogOpen] = useState(false)
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInitiator, setSelectedInitiator] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedOperator, setSelectedOperator] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [newLocationName, setNewLocationName] = useState('')
  const [formData, setFormData] = useState({
    projectTitle: '',
    shootingDate: new Date().toISOString().split('T')[0],
    mainLocation: '',
    numberOfCameramen: '1',
    notes: ''
  })
  
  // Get current user's job position
  const userPosition = currentUser?.position || 'Reporter'
  
  // Get operators for assignment
  const operators = mockUsers.filter(user => user.position === 'Operator')
  
  // Get drivers for assignment
  const drivers = mockUsers.filter(user => user.position === 'Driver')
  
  // Get available equipment
  const availableEquipment = mockEquipment.filter(item => item.status === 'Available')
  
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
      } else if (userPosition === 'Operator') {
        filtered = filtered.filter(r => r.assignedEquipment?.includes(currentUser?.id || ''))
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
    // Find an operator automatically
    const availableOperators = mockUsers.filter(user => user.position === 'Operator')
    const randomOperator = availableOperators[Math.floor(Math.random() * availableOperators.length)]
    
    const newRequest: ShootingRequest = {
      id: Date.now().toString(),
      projectTitle: formData.projectTitle,
      shootingDate: formData.shootingDate,
      mainLocation: formData.mainLocation,
      extraLocations: [],
      numberOfCameramen: parseInt(formData.numberOfCameramen),
      notes: formData.notes || undefined,
      initiatorId: selectedInitiator,
      reporterId: currentUser?.id || '3', // Default to Emily Davis if no current user
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setRequests([...requests, newRequest])
    
    toast({
      title: "Request Created",
      description: "Your shooting request has been created successfully.",
    })
    setIsCreateDialogOpen(false)
    
    // Reset form
    setFormData({
      projectTitle: '',
      shootingDate: new Date().toISOString().split('T')[0],
      mainLocation: '',
      numberOfCameramen: '1',
      notes: ''
    })
    setSelectedInitiator('')
  }
  
  const handleViewRequest = (request: ShootingRequest) => {
    setSelectedRequest(request)
    setIsViewDialogOpen(true)
  }
  
  const handleSubmitRequest = (requestId: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'Submitted' as const, updatedAt: new Date().toISOString() }
        : req
    )
    setRequests(updatedRequests)
    setIsViewDialogOpen(false)
    
    toast({
      title: "Request Submitted",
      description: "Your request has been submitted for approval.",
    })
  }
  
  const handleApproveRequest = () => {
    if (!selectedRequest) return
    
    setIsAssignDriverDialogOpen(true)
  }
  
  const handleAssignDriver = () => {
    if (!selectedRequest || !selectedDriver) return
    
    const driverVehicle = mockVehicles.find(v => v.driverId === selectedDriver)
    
    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            status: 'Admin Approved' as const, 
            driverId: selectedDriver,
            updatedAt: new Date().toISOString() 
          }
        : req
    )
    
    setRequests(updatedRequests)
    setIsAssignDriverDialogOpen(false)
    setIsViewDialogOpen(false)
    
    toast({
      title: "Request Approved",
      description: "The request has been approved and a driver has been assigned.",
    })
    
    setSelectedDriver('')
  }
  
  const handleRejectRequest = (requestId: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'Rejected' as const, updatedAt: new Date().toISOString() }
        : req
    )
    setRequests(updatedRequests)
    setIsViewDialogOpen(false)
    
    toast({
      title: "Request Rejected",
      description: "The request has been rejected.",
      variant: "destructive"
    })
  }
  
  const handleAssignEquipment = () => {
    if (!selectedRequest) return
    
    setIsAssignEquipmentDialogOpen(true)
  }
  
  const handleConfirmEquipmentAssignment = () => {
    if (!selectedRequest || selectedEquipment.length === 0) return
    
    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            status: 'Equipment Assigned' as const, 
            equipmentAssigned: true,
            assignedEquipment: selectedEquipment,
            updatedAt: new Date().toISOString() 
          }
        : req
    )
    
    setRequests(updatedRequests)
    setIsAssignEquipmentDialogOpen(false)
    setIsViewDialogOpen(false)
    
    toast({
      title: "Equipment Assigned",
      description: "Equipment has been assigned to the request.",
    })
    
    setSelectedEquipment([])
  }
  
  const handleUpdateTripStatus = (requestId: string, newStatus: ShootingRequest['tripStatus']) => {
    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        let newRequestStatus = req.status
        
        // Update request status based on trip status
        if (newStatus === 'Started' && req.status === 'Equipment Assigned') {
          newRequestStatus = 'Trip Started'
        } else if (newStatus === 'Returned') {
          newRequestStatus = 'Trip Returned'
        }
        
        return { 
          ...req, 
          tripStatus: newStatus,
          status: newRequestStatus as ShootingRequest['status'],
          updatedAt: new Date().toISOString(),
          // Update current location for tracking
          currentLocation: { lat: 37.7749 + Math.random() * 0.1, lng: -122.4194 + Math.random() * 0.1 }
        }
      }
      return req
    })
    
    setRequests(updatedRequests)
    
    toast({
      title: "Trip Status Updated",
      description: `Trip status has been updated to ${newStatus}.`,
    })
  }
  
  const handleConfirmEquipmentReturn = (requestId: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: 'Equipment Returned' as const, 
            equipmentReturned: true,
            updatedAt: new Date().toISOString() 
          }
        : req
    )
    
    setRequests(updatedRequests)
    setIsViewDialogOpen(false)
    
    toast({
      title: "Equipment Return Confirmed",
      description: "Equipment return has been confirmed.",
    })
  }
  
  const handleFinalizeRequest = (requestId: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'Finished' as const, updatedAt: new Date().toISOString() }
        : req
    )
    
    setRequests(updatedRequests)
    setIsViewDialogOpen(false)
    
    toast({
      title: "Request Finalized",
      description: "The request has been finalized.",
    })
  }
  
  const handleAddExtraLocation = () => {
    if (!selectedRequest || !newLocationName) return
    
    const newLocation: ExtraLocation = {
      id: Date.now().toString(),
      name: newLocationName,
      approved: false
    }
    
    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            extraLocations: [...req.extraLocations, newLocation],
            updatedAt: new Date().toISOString() 
          }
        : req
    )
    
    setRequests(updatedRequests)
    setIsAddLocationDialogOpen(false)
    
    // Update the selected request to reflect changes in the view dialog
    setSelectedRequest({
      ...selectedRequest,
      extraLocations: [...selectedRequest.extraLocations, newLocation]
    })
    
    toast({
      title: "Location Added",
      description: "Extra location has been added and is pending approval.",
    })
    
    setNewLocationName('')
  }
  
  const handleApproveExtraLocation = (requestId: string, locationId: string) => {
    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        const updatedLocations = req.extraLocations.map(loc => 
          loc.id === locationId ? { ...loc, approved: true } : loc
        )
        
        return { 
          ...req, 
          extraLocations: updatedLocations,
          updatedAt: new Date().toISOString() 
        }
      }
      return req
    })
    
    setRequests(updatedRequests)
    
    // Update the selected request to reflect changes in the view dialog
    if (selectedRequest && selectedRequest.id === requestId) {
      const updatedLocations = selectedRequest.extraLocations.map(loc => 
        loc.id === locationId ? { ...loc, approved: true } : loc
      )
      
      setSelectedRequest({
        ...selectedRequest,
        extraLocations: updatedLocations
      })
    }
    
    toast({
      title: "Location Approved",
      description: "Extra location has been approved.",
    })
  }
  
  const handleChangeOperator = () => {
    if (!selectedRequest || !selectedOperator) return
    
    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            reporterId: selectedOperator,
            updatedAt: new Date().toISOString() 
          }
        : req
    )
    
    setRequests(updatedRequests)
    
    // Update the selected request
    setSelectedRequest({
      ...selectedRequest,
      reporterId: selectedOperator
    })
    
    toast({
      title: "Operator Changed",
      description: "The operator has been changed successfully.",
    })
    
    setSelectedOperator('')
  }
  
  const toggleEquipmentSelection = (equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    )
  }
  
  const getUserById = (userId: string) => {
    return mockUsers.find(user => user.id === userId)
  }
  
  const getVehicleByDriverId = (driverId: string) => {
    return mockVehicles.find(vehicle => vehicle.driverId === driverId)
  }
  
  const getEquipmentById = (equipmentId: string) => {
    return mockEquipment.find(equipment => equipment.id === equipmentId)
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
                              <UserIcon className="h-4 w-4 mr-1" />
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
                            <Button size="sm" variant="outline" className="bg-green-50 text-green-600 border-green-200" onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRequest(request)
                              handleApproveRequest()
                            }}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="bg-red-50 text-red-600 border-red-200" onClick={(e) => {
                              e.stopPropagation()
                              handleRejectRequest(request.id)
                            }}>
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
              <Label htmlFor="projectTitle">Project Title *</Label>
              <Input 
                id="projectTitle" 
                placeholder="Enter project title" 
                value={formData.projectTitle}
                onChange={(e) => setFormData({...formData, projectTitle: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shootingDate">Shooting Date *</Label>
              <Input 
                id="shootingDate" 
                type="date" 
                value={formData.shootingDate}
                onChange={(e) => setFormData({...formData, shootingDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mainLocation">Main Location *</Label>
              <Input 
                id="mainLocation" 
                placeholder="Enter main location" 
                value={formData.mainLocation}
                onChange={(e) => setFormData({...formData, mainLocation: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cameramen">Number of Cameramen *</Label>
              <Select 
                value={formData.numberOfCameramen}
                onValueChange={(value) => setFormData({...formData, numberOfCameramen: value})}
              >
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
              <Label htmlFor="initiator">Initiator *</Label>
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
              <Textarea 
                id="notes" 
                placeholder="Enter any additional notes" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRequest}
                disabled={!formData.projectTitle || !formData.mainLocation || !selectedInitiator}
              >
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
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedRequest.numberOfCameramen}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reporter/Operator</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{getUserById(selectedRequest.reporterId)?.name || 'Unknown'}</span>
                    </div>
                    {userPosition === 'Admin' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedOperator(selectedRequest.reporterId)
                          setIsViewDialogOpen(false)
                          setTimeout(() => {
                            setIsViewDialogOpen(true)
                          }, 100)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Change
                      </Button>
                    )}
                  </div>
                  {selectedOperator && (
                    <div className="mt-2">
                      <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map(operator => (
                            <SelectItem key={operator.id} value={operator.id}>
                              {operator.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end mt-2">
                        <Button size="sm" onClick={handleChangeOperator}>
                          Confirm Change
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedRequest.driverId && (
                  <div className="space-y-2">
                    <Label>Assigned Driver</Label>
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{getUserById(selectedRequest.driverId)?.name || 'Unknown'}</span>
                    </div>
                  </div>
                )}
                
                {selectedRequest.tripStatus && (
                  <div className="space-y-2">
                    <Label>Trip Status</Label>
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedRequest.tripStatus}</span>
                      
                      {userPosition === 'Driver' && selectedRequest.driverId === currentUser?.id && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2"
                          onClick={() => setIsGpsDialogOpen(true)}
                        >
                          <Map className="h-3 w-3 mr-1" />
                          GPS
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Extra Locations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Extra Locations</Label>
                  {(userPosition === 'Reporter' || userPosition === 'Admin') && 
                   selectedRequest.status !== 'Finished' && 
                   selectedRequest.status !== 'Rejected' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAddLocationDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Location
                    </Button>
                  )}
                </div>
                
                {selectedRequest.extraLocations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRequest.extraLocations.map(location => (
                      <div key={location.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{location.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Badge variant={location.approved ? 'default' : 'outline'}>
                            {location.approved ? 'Approved' : 'Pending Approval'}
                          </Badge>
                          
                          {userPosition === 'Admin' && !location.approved && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleApproveExtraLocation(selectedRequest.id, location.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No extra locations added</p>
                )}
              </div>
              
              {/* Assigned Equipment */}
              {selectedRequest.assignedEquipment && selectedRequest.assignedEquipment.length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Equipment</Label>
                  <div className="space-y-2">
                    {selectedRequest.assignedEquipment.map(equipmentId => {
                      const equipment = getEquipmentById(equipmentId)
                      return equipment ? (
                        <div key={equipment.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{equipment.name}</span>
                          </div>
                          <Badge variant="outline">
                            {equipment.type}
                          </Badge>
                        </div>
                      ) : null
                    })}
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
                  <Button onClick={() => handleSubmitRequest(selectedRequest.id)}>
                    Submit Request
                  </Button>
                )}
                
                {userPosition === 'Reporter' && selectedRequest.status === 'Equipment Returned' && (
                  <Button onClick={() => handleFinalizeRequest(selectedRequest.id)}>
                    Finalize Request
                  </Button>
                )}
                
                {userPosition === 'Admin' && selectedRequest.status === 'Submitted' && (
                  <div className="flex space-x-2">
                    <Button variant="outline" className="bg-red-50 text-red-600 border-red-200" onClick={() => handleRejectRequest(selectedRequest.id)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button className="bg-green-600" onClick={handleApproveRequest}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve & Assign Driver
                    </Button>
                  </div>
                )}
                
                {userPosition === 'Equipment Department' && selectedRequest.status === 'Admin Approved' && (
                  <Button onClick={handleAssignEquipment}>
                    <Package className="h-4 w-4 mr-1" />
                    Assign Equipment
                  </Button>
                )}
                
                {userPosition === 'Equipment Department' && selectedRequest.status === 'Trip Returned' && (
                  <Button onClick={() => handleConfirmEquipmentReturn(selectedRequest.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm Equipment Return
                  </Button>
                )}
                
                {userPosition === 'Driver' && selectedRequest.status === 'Equipment Assigned' && selectedRequest.driverId === currentUser?.id && (
                  <Button onClick={() => handleUpdateTripStatus(selectedRequest.id, 'Started')}>
                    <Truck className="h-4 w-4 mr-1" />
                    Start Trip
                  </Button>
                )}
                
                {userPosition === 'Driver' && selectedRequest.status === 'Trip Started' && selectedRequest.driverId === currentUser?.id && (
                  <Button onClick={() => handleUpdateTripStatus(selectedRequest.id, 'Returned')}>
                    <Truck className="h-4 w-4 mr-1" />
                    Complete Trip
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDriverDialogOpen} onOpenChange={setIsAssignDriverDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>Select a driver to assign to this request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedDriver && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Driver Information</h4>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getUserById(selectedDriver)?.avatar} />
                    <AvatarFallback>
                      {getUserById(selectedDriver)?.name.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getUserById(selectedDriver)?.name}</p>
                    <p className="text-sm text-muted-foreground">{getUserById(selectedDriver)?.position}</p>
                  </div>
                </div>
                
                {getVehicleByDriverId(selectedDriver) && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Assigned Vehicle</h4>
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>{getVehicleByDriverId(selectedDriver)?.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {getVehicleByDriverId(selectedDriver)?.licensePlate}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignDriverDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignDriver}
                disabled={!selectedDriver}
              >
                Assign Driver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Assign Equipment Dialog */}
      <Dialog open={isAssignEquipmentDialogOpen} onOpenChange={setIsAssignEquipmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Equipment</DialogTitle>
            <DialogDescription>Select equipment to assign to this request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Available Equipment</h4>
              <Badge variant="outline">
                {selectedEquipment.length} items selected
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {mockEquipment.map(equipment => (
                <div 
                  key={equipment.id} 
                  className={`p-3 border rounded-lg ${
                    equipment.status !== 'Available' ? 'opacity-50' : 
                    selectedEquipment.includes(equipment.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={selectedEquipment.includes(equipment.id)}
                        onCheckedChange={() => {
                          if (equipment.status === 'Available') {
                            toggleEquipmentSelection(equipment.id)
                          }
                        }}
                        disabled={equipment.status !== 'Available'}
                      />
                      <div>
                        <p className="font-medium">{equipment.name}</p>
                        <p className="text-sm text-muted-foreground">{equipment.type}</p>
                      </div>
                    </div>
                    <Badge variant={
                      equipment.status === 'Available' ? 'outline' : 
                      equipment.status === 'Assigned' ? 'secondary' : 'destructive'
                    }>
                      {equipment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignEquipmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmEquipmentAssignment}
                disabled={selectedEquipment.length === 0}
              >
                Assign Equipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* GPS Tracking Dialog */}
      <Dialog open={isGpsDialogOpen} onOpenChange={setIsGpsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GPS Tracking</DialogTitle>
            <DialogDescription>Live location tracking for this request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Map className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Map would display here with current location</p>
                    {selectedRequest.currentLocation && (
                      <p className="text-sm font-mono mt-2">
                        Lat: {selectedRequest.currentLocation.lat.toFixed(6)}, 
                        Lng: {selectedRequest.currentLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Trip Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">{selectedRequest.tripStatus || 'Not Started'}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{selectedRequest.mainLocation}</p>
                    </div>
                  </div>
                </div>
                
                {userPosition === 'Driver' && selectedRequest.driverId === currentUser?.id && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Update Trip Status</h4>
                    <div className="flex space-x-2">
                      {selectedRequest.tripStatus === 'Not Started' && (
                        <Button onClick={() => {
                          handleUpdateTripStatus(selectedRequest.id, 'Started')
                          setIsGpsDialogOpen(false)
                        }}>
                          Start Trip
                        </Button>
                      )}
                      {selectedRequest.tripStatus === 'Started' && (
                        <Button onClick={() => {
                          handleUpdateTripStatus(selectedRequest.id, 'Arrived')
                          setIsGpsDialogOpen(false)
                        }}>
                          Mark as Arrived
                        </Button>
                      )}
                      {selectedRequest.tripStatus === 'Arrived' && (
                        <Button onClick={() => {
                          handleUpdateTripStatus(selectedRequest.id, 'Waiting')
                          setIsGpsDialogOpen(false)
                        }}>
                          Mark as Waiting
                        </Button>
                      )}
                      {(selectedRequest.tripStatus === 'Arrived' || selectedRequest.tripStatus === 'Waiting') && (
                        <Button onClick={() => {
                          handleUpdateTripStatus(selectedRequest.id, 'Returning')
                          setIsGpsDialogOpen(false)
                        }}>
                          Start Return Trip
                        </Button>
                      )}
                      {selectedRequest.tripStatus === 'Returning' && (
                        <Button onClick={() => {
                          handleUpdateTripStatus(selectedRequest.id, 'Returned')
                          setIsGpsDialogOpen(false)
                        }}>
                          Complete Trip
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsGpsDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Extra Location Dialog */}
      <Dialog open={isAddLocationDialogOpen} onOpenChange={setIsAddLocationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Extra Location</DialogTitle>
            <DialogDescription>Add an additional shooting location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name *</Label>
              <Input 
                id="locationName" 
                placeholder="Enter location name" 
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddLocationDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddExtraLocation}
                disabled={!newLocationName}
              >
                Add Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}