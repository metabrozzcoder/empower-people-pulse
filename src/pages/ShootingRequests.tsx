import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge' 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from "@/components/ui/input"
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Filter,
  Search
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Car,
  Package,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText
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

interface User {
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
const mockUsers: User[] = [
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
]
import { useAuth } from "@/context/AuthContext"

// Define types
interface ShootingRequest {
  id: string
  projectTitle: string
  shootingDate: string
  mainLocation: string
  numberOfCameramen: number
  notes?: string
  initiatorId: string
  reporterId: string
  status: 'draft' | 'submitted' | 'adminApproved' | 'equipmentAssigned' | 'tripStarted' | 'tripReturned' | 'equipmentReturned' | 'finished' | 'rejected'
  driverId?: string
  vehicleId?: string
  extraLocations?: ExtraLocation[]
  assignedEquipment?: Equipment[]
  tripStatus?: 'notStarted' | 'started' | 'arrived' | 'waiting' | 'returningToOffice' | 'returned'
  createdAt: string
  updatedAt: string
  adminApprovedAt?: string
  equipmentAssignedAt?: string
  tripStartedAt?: string
  tripReturnedAt?: string
  equipmentReturnedAt?: string
  finishedAt?: string
}

interface ExtraLocation {
  id: string
  requestId: string
  locationName: string
  isApproved: boolean
  approvedAt?: string
}

interface Equipment {
  id: string
  name: string
  type: string
  isAssigned: boolean
  assignedToRequestId?: string
  isReturned?: boolean
  returnedAt?: string
}

interface Vehicle {
  id: string
  model: string
  licensePlate: string
  driverId: string
  isAvailable: boolean
  currentLocation?: string
  lastUpdated?: string
}

// Mock data
const mockRequests: ShootingRequest[] = [
  {
    id: '1',
    projectTitle: 'Downtown Market Feature',
    shootingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    mainLocation: 'Central Market, Downtown',
    numberOfCameramen: 2,
    notes: 'Focus on local vendors and seasonal produce',
    initiatorId: '3', // Emily Davis
    reporterId: '2', // John Smith
    status: 'submitted',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    projectTitle: 'City Council Meeting',
    shootingDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    mainLocation: 'City Hall, Room 302',
    numberOfCameramen: 1,
    notes: 'Budget discussion, mayor will be present',
    initiatorId: '4', // David Chen
    reporterId: '2', // John Smith
    status: 'adminApproved',
    driverId: '5', // Lisa Brown
    vehicleId: '1', // News Van 1
    adminApprovedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    projectTitle: 'Tech Conference Coverage',
    shootingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    mainLocation: 'Convention Center, Hall B',
    numberOfCameramen: 3,
    notes: 'Full day event, multiple interviews scheduled',
    initiatorId: '3', // Emily Davis
    reporterId: '6', // Robert Taylor
    status: 'equipmentAssigned',
    driverId: '7', // James Park
    vehicleId: '2', // News Van 2
    adminApprovedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    equipmentAssignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tripStatus: 'notStarted',
  }
];

const mockExtraLocations: ExtraLocation[] = [
  {
    id: '1',
    requestId: '1',
    locationName: 'Farmer\'s Co-op Office',
    isApproved: false,
  },
  {
    id: '2',
    requestId: '2',
    locationName: 'Press Conference Room',
    isApproved: true,
    approvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  }
];

const mockEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Sony PXW-Z280',
    type: 'Camera',
    isAssigned: true,
    assignedToRequestId: '3',
    isReturned: false,
  },
  {
    id: '2',
    name: 'Canon C300 Mark III',
    type: 'Camera',
    isAssigned: false,
    isReturned: true,
  },
  {
    id: '3',
    name: 'Sennheiser MKH 416',
    type: 'Microphone',
    isAssigned: true,
    assignedToRequestId: '3',
    isReturned: false,
  }
];

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    model: 'Ford Transit',
    licensePlate: 'NEWS-001',
    driverId: '5', // Lisa Brown
    isAvailable: true,
    currentLocation: '37.7749,-122.4194', // San Francisco coordinates
    lastUpdated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    model: 'Mercedes Sprinter',
    licensePlate: 'NEWS-002',
    driverId: '7', // James Park
    isAvailable: false,
    currentLocation: '37.3382,-121.8863', // San Jose coordinates
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  }
];

const mockUsers = [
  { id: '3', name: 'Emily Davis', position: 'Initiator' },
  { id: '4', name: 'David Chen', position: 'Initiator' },
  { id: '5', name: 'Lisa Brown', position: 'Driver' },
  { id: '7', name: 'James Park', position: 'Driver' },
  { id: '8', name: 'Alex Wilson', position: 'Initiator' }
];

export default function ShootingRequests() {
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState<ShootingRequest[]>(mockRequests)
  const [extraLocations, setExtraLocations] = useState<ExtraLocation[]>(mockExtraLocations)
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment)
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ShootingRequest | null>(null)
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false)
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false)
  const [isAssignEquipmentDialogOpen, setIsAssignEquipmentDialogOpen] = useState(false)
  const [isUpdateTripDialogOpen, setIsUpdateTripDialogOpen] = useState(false)
  
  // Form state for creating a request
  const [formData, setFormData] = useState({
    projectTitle: '',
    shootingDate: new Date().toISOString().split('T')[0],
    mainLocation: '',
    numberOfCameramen: 1,
    notes: '',
    initiatorId: ''
  })
  
  // Form state for adding a location
  const [newLocation, setNewLocation] = useState('')
  
  // Form state for assigning a driver
  const [selectedDriverId, setSelectedDriverId] = useState('')
  
  // Form state for assigning equipment
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])
  
  // Form state for updating trip status
  const [selectedTripStatus, setSelectedTripStatus] = useState<string>('notStarted')
  
  // Get current user's job position
  const userPosition = currentUser?.position || 'Reporter'
  
  // Filter requests based on job position
  const getRequestsByPosition = () => {
    switch (userPosition) {
      case 'Reporter':
        return requests.filter(r => r.reporterId === currentUser?.id)
      case 'Admin':
      case 'Head of Reporters':
        return requests.filter(r => 
          r.status === 'submitted' || 
          r.status === 'adminApproved'
        )
      case 'Equipment Department':
        return requests.filter(r => 
          r.status === 'adminApproved' || 
          r.status === 'tripReturned'
        )
      case 'Driver':
        return requests.filter(r => 
          r.driverId === currentUser?.id && 
          r.status === 'equipmentAssigned'
        )
      default:
        return []
    }
  }
  
  // Filter requests based on selected filter
  const filteredRequests = () => {
    let filtered = getRequestsByPosition()
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.mainLocation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(r => r.status === selectedFilter)
    }
    
    return filtered
  }
  
  // Get extra locations for a request
  const getExtraLocationsForRequest = (requestId: string) => {
    return extraLocations.filter(l => l.requestId === requestId)
  }
  
  // Get assigned equipment for a request
  const getAssignedEquipmentForRequest = (requestId: string) => {
    return equipment.filter(e => e.assignedToRequestId === requestId)
  }
  
  // Get vehicle for a request
  const getVehicleForRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (!request || !request.vehicleId) return null
    
    return vehicles.find(v => v.id === request.vehicleId)
  }
  
  // Get status color
  const getStatusColor = (status: ShootingRequest['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'adminApproved': return 'bg-green-100 text-green-800'
      case 'equipmentAssigned': return 'bg-purple-100 text-purple-800'
      case 'tripStarted': return 'bg-orange-100 text-orange-800'
      case 'tripReturned': return 'bg-teal-100 text-teal-800'
      case 'equipmentReturned': return 'bg-indigo-100 text-indigo-800'
      case 'finished': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Get status text
  const getStatusText = (status: ShootingRequest['status']) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'submitted': return 'Submitted'
      case 'adminApproved': return 'Admin Approved'
      case 'equipmentAssigned': return 'Equipment Assigned'
      case 'tripStarted': return 'Trip Started'
      case 'tripReturned': return 'Trip Returned'
      case 'equipmentReturned': return 'Equipment Returned'
      case 'finished': return 'Finished'
      case 'rejected': return 'Rejected'
      default: return 'Unknown'
    }
  }
  
  // Get trip status text
  const getTripStatusText = (status: string) => {
    switch (status) {
      case 'notStarted': return 'Not Started'
      case 'started': return 'Started'
      case 'arrived': return 'Arrived at Location'
      case 'waiting': return 'Waiting'
      case 'returningToOffice': return 'Returning to Office'
      case 'returned': return 'Returned'
      default: return 'Unknown'
    }
  }
  
  // Create a new request
  const handleCreateRequest = () => {
    if (!formData.projectTitle || !formData.mainLocation || !formData.initiatorId) {
      toast({
    })
  }
  
  // Handle reject request
  const handleRejectRequest = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'rejected', updatedAt: new Date().toISOString() } 
        : r
    ))
    
    toast({
      title: "Request Rejected",
      description: "Request has been rejected.",
      variant: "destructive"
    })
  }
  
  // Handle assign equipment
  const handleAssignEquipment = (requestId: string, equipmentIds: string[]) => {
    // Update request status
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: 'equipmentAssigned',
            equipmentAssignedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString() 
          } 
        : r
    ))
    
    // Update equipment status
    setEquipment(equipment.map(e => 
      equipmentIds.includes(e.id)
        ? { ...e, isAssigned: true, assignedToRequestId: requestId, isReturned: false }
        : e
    ))
    
    toast({
      title: "Equipment Assigned",
      description: "Equipment has been assigned to the request.",
    })
  }
  
  // Handle update trip status
  const handleUpdateTripStatus = (requestId: string, tripStatus: string) => {
    let newRequestStatus = ''
    let tripStartedAt = undefined
    let tripReturnedAt = undefined
    
    // Determine if request status should also change
    if (tripStatus === 'started') {
      newRequestStatus = 'tripStarted'
      tripStartedAt = new Date().toISOString()
    } else if (tripStatus === 'returned') {
      newRequestStatus = 'tripReturned'
      tripReturnedAt = new Date().toISOString()
    }
    
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: newRequestStatus ? newRequestStatus : r.status,
            tripStatus: tripStatus as any,
            tripStartedAt: tripStartedAt || r.tripStartedAt,
            tripReturnedAt: tripReturnedAt || r.tripReturnedAt,
            updatedAt: new Date().toISOString() 
          } 
        : r
    ))
    
    toast({
      title: "Trip Status Updated",
      description: `Trip status updated to ${formatTripStatus(tripStatus)}.`,
    })
  }
  
  // Handle confirm equipment return
  const handleConfirmEquipmentReturn = (requestId: string) => {
    // Update request status
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: 'equipmentReturned',
            equipmentReturnedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString() 
          } 
        : r
    ))
    
    // Update equipment status
    setEquipment(equipment.map(e => 
      e.assignedToRequestId === requestId
        ? { 
            ...e, 
            isReturned: true, 
            returnedAt: new Date().toISOString(),
            isAssigned: false,
            assignedToRequestId: undefined
          }
        : e
    ))
    
    toast({
      title: "Equipment Return Confirmed",
      description: "Equipment return has been confirmed.",
    })
  }
  
  // Handle finalize request
  const handleFinalizeRequest = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: 'finished',
            finishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString() 
          } 
        : r
    ))
    
    toast({
      title: "Request Finalized",
      description: "Request has been finalized successfully.",
    })
  }
  
  // Handle add extra location
  const handleAddExtraLocation = (requestId: string, locationName: string) => {
    const newLocation: ExtraLocation = {
      id: Date.now().toString(),
      requestId,
      name: locationName,
      isApproved: false
    }
    
    setExtraLocations([...extraLocations, newLocation])
    
    toast({
      title: "Extra Location Added",
      description: "Extra location has been added (pending approval).",
    })
  }
  
  // Handle approve extra location
  const handleApproveExtraLocation = (locationId: string) => {
    setExtraLocations(extraLocations.map(loc => 
      loc.id === locationId
        ? { ...loc, isApproved: true, approvedAt: new Date().toISOString() }
        : loc
    ))
    
    toast({
      title: "Location Approved",
      description: "Extra location has been approved.",
    })
  }
  
  // Get extra locations for a request
  const getExtraLocationsForRequest = (requestId: string) => {
    return extraLocations.filter(loc => loc.requestId === requestId)
  }
  
  // Get assigned equipment for a request
  const getAssignedEquipmentForRequest = (requestId: string) => {
    return equipment.filter(e => e.assignedToRequestId === requestId)
  }
  
  // Get vehicle for a request
  const getVehicleForRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (!request || !request.vehicleId) return null
    
    return vehicles.find(v => v.id === request.vehicleId)
  }
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState<ShootingRequest[]>(mockRequests)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false)
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false)
  const [isAssignEquipmentDialogOpen, setIsAssignEquipmentDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ShootingRequest | null>(null)
  const [newLocation, setNewLocation] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [newRequest, setNewRequest] = useState<Partial<ShootingRequest>>({
    projectTitle: '',
    shootingDate: '',
    mainLocation: '',
    numberOfCameramen: 1,
    notes: '',
    initiatorId: '',
    extraLocations: []
  })

  // Get current user's position
  const userPosition = currentUser?.position || ''
  
  // Filter requests based on user's position
  const getAccessibleRequests = () => {
    if (!currentUser) return []
    
    switch (userPosition) {
      case 'Reporter':
        return requests.filter(req => req.reporterId === currentUser.id)
      case 'Admin':
      case 'Head of Reporters':
        return requests
      case 'Driver':
        return requests.filter(req => req.driverId === currentUser.id && 
          ['Admin Approved', 'Equipment Assigned', 'Trip Started', 'Trip Returned'].includes(req.status))
      case 'Equipment Department':
        return requests.filter(req => 
          ['Admin Approved', 'Equipment Assigned', 'Trip Returned'].includes(req.status))
      case 'Initiator':
        return requests.filter(req => req.initiatorId === currentUser.id)
      default:
        return []
    }
  }

  const accessibleRequests = getAccessibleRequests()
  
  // Apply filters
  const filteredRequests = accessibleRequests.filter(req => {
    const matchesSearch = req.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.mainLocation.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: ShootingRequest['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Submitted': return 'bg-blue-100 text-blue-800'
      case 'Admin Approved': return 'bg-green-100 text-green-800'
      case 'Equipment Assigned': return 'bg-purple-100 text-purple-800'
      case 'Trip Started': return 'bg-yellow-100 text-yellow-800'
      case 'Trip Returned': return 'bg-orange-100 text-orange-800'
      case 'Equipment Returned': return 'bg-indigo-100 text-indigo-800'
      case 'Finished': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTripStatusColor = (status?: string) => {
    switch (status) {
      case 'Started': return 'bg-yellow-100 text-yellow-800'
      case 'Arrived': return 'bg-green-100 text-green-800'
      case 'Waiting': return 'bg-blue-100 text-blue-800'
      case 'Returning': return 'bg-orange-100 text-orange-800'
      case 'Returned': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserById = (id: string) => {
    return mockUsers.find(user => user.id === id) || { id: '', name: 'Unknown', position: '' }
  }

  const getVehicleByDriverId = (driverId: string) => {
    return mockVehicles.find(vehicle => vehicle.driverId === driverId)
  }

  const handleCreateRequest = () => {
    setNewRequest({
      projectTitle: '',
      shootingDate: '',
      mainLocation: '',
      numberOfCameramen: 1,
      notes: '',
      initiatorId: '',
      extraLocations: []
    })
    setIsCreateDialogOpen(true)
  }

  const handleViewRequest = (request: ShootingRequest) => {
    setSelectedRequest(request)
    setIsViewDialogOpen(true)
  }

  const handleAddLocation = () => {
    if (!selectedRequest) return
    setNewLocation('')
    setIsAddLocationDialogOpen(true)
  }

  const handleAssignDriver = () => {
    if (!selectedRequest) return
    setSelectedDriver('')
    setIsAssignDriverDialogOpen(true)
  }

  const handleAssignEquipment = () => {
    if (!selectedRequest) return
    setIsAssignEquipmentDialogOpen(true)
  }

  const handleSaveRequest = () => {
    if (!newRequest.projectTitle || !newRequest.shootingDate || !newRequest.mainLocation || !newRequest.initiatorId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    const request: ShootingRequest = {
      id: Date.now().toString(),
      projectTitle: newRequest.projectTitle || '',
      shootingDate: newRequest.shootingDate || '',
      mainLocation: newRequest.mainLocation || '',
      extraLocations: newRequest.extraLocations || [],
      numberOfCameramen: newRequest.numberOfCameramen || 1,
      notes: newRequest.notes,
      initiatorId: newRequest.initiatorId || '',
      reporterId: currentUser?.id || '',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setRequests([...requests, request])
    setIsCreateDialogOpen(false)
    
    toast({
      title: "Request Created",
      description: "Shooting request has been created successfully.",
    })
  }

  const handleSubmitRequest = (requestId: string) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'Submitted', updatedAt: new Date().toISOString() } 
          : req
      )
    )
    
    toast({
      title: "Request Submitted",
      description: "Shooting request has been submitted for approval.",
    })
  }

  const handleApproveRequest = (requestId: string) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'Admin Approved', updatedAt: new Date().toISOString() } 
          : req
      )
    )
    
    toast({
      title: "Request Approved",
      description: "Shooting request has been approved.",
    })
  }

  const handleRejectRequest = (requestId: string) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'Rejected', updatedAt: new Date().toISOString() } 
          : req
      )
    )
    
    toast({
      title: "Request Rejected",
      description: "Shooting request has been rejected.",
    })
  }

  const handleSaveLocation = () => {
    if (!newLocation.trim() || !selectedRequest) return
    
    const newLocationObj: ExtraLocation = {
      id: Date.now().toString(),
      name: newLocation,
      approved: false
    }
    
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              extraLocations: [...req.extraLocations, newLocationObj],
              updatedAt: new Date().toISOString()
            } 
          : req
      )
    )
    
    setIsAddLocationDialogOpen(false)
    
    toast({
      title: "Location Added",
      description: "Extra location has been added and is pending approval.",
    })
  }

  const handleApproveLocation = (requestId: string, locationId: string) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              extraLocations: req.extraLocations.map(loc => 
                loc.id === locationId ? { ...loc, approved: true } : loc
              ),
              updatedAt: new Date().toISOString()
            } 
          : req
      )
    )
    
    toast({
      title: "Location Approved",
      description: "Extra location has been approved.",
    })
  }

  const handleSaveDriver = () => {
    if (!selectedDriver || !selectedRequest) return
    
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              driverId: selectedDriver,
              updatedAt: new Date().toISOString()
            } 
          : req
      )
    )
    
    setIsAssignDriverDialogOpen(false)
    
    toast({
      title: "Driver Assigned",
      description: "Driver has been assigned to the shooting request.",
    })
  }

  const handleAssignEquipmentComplete = () => {
    if (!selectedRequest) return
    
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              equipmentAssigned: true,
              status: 'Equipment Assigned',
              updatedAt: new Date().toISOString()
            } 
          : req
      )
    )
    
    setIsAssignEquipmentDialogOpen(false)
    
    toast({
      title: "Equipment Assigned",
      description: "Equipment has been assigned to the shooting request.",
    })
  }

  const handleUpdateTripStatus = (requestId: string, status: ShootingRequest['tripStatus']) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              tripStatus: status,
              status: status === 'Returned' ? 'Trip Returned' : 'Trip Started',
              updatedAt: new Date().toISOString()
            } 
          : req
      )
    )
    
    toast({
      title: "Trip Status Updated",
      description: `Trip status has been updated to ${status}.`,
    })
  }

  const handleConfirmEquipmentReturn = (requestId: string) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              equipmentReturned: true,
              status: 'Equipment Returned',
              updatedAt: new Date().toISOString()
            } 
          : req
      )
    )
    
    toast({
      title: "Equipment Return Confirmed",
      description: "Equipment return has been confirmed.",
    })
  }

  const handleFinishRequest = (requestId: string) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'Finished',
              updatedAt: new Date().toISOString()
            } 
          : req
      )
    )
    
    toast({
      title: "Request Finished",
      description: "Shooting request has been marked as finished.",
    })
  }

  const handleDeleteRequest = (requestId: string) => {
    setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId))
    
    toast({
      title: "Request Deleted",
      description: "Shooting request has been deleted.",
    })
  }

  const canCreateRequest = userPosition === 'Reporter'
  const canApproveRequest = userPosition === 'Admin' || userPosition === 'Head of Reporters'
  const canAssignEquipment = userPosition === 'Equipment Department'
  const canUpdateTripStatus = userPosition === 'Driver'
  const canFinishRequest = userPosition === 'Reporter'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shooting Requests</h1>
          Manage shooting requests, equipment, and trip logistics
        </div>
        {canCreateRequest && (
          <Button onClick={handleCreateRequest} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
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

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="active">Active Trips</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const reporter = getUserById(request.reporterId)
              const initiator = getUserById(request.initiatorId)
              const driver = request.driverId ? getUserById(request.driverId) : null
              
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Camera className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{request.projectTitle}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                              {request.tripStatus && (
                                <Badge className={getTripStatusColor(request.tripStatus)}>
                                  Trip: {request.tripStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{new Date(request.shootingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{request.mainLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>Reporter: {reporter.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>Initiator: {initiator.name}</span>
                          </div>
                        </div>
                        
                        {request.extraLocations.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Extra Locations:</span>
                            <div className="flex flex-wrap gap-1">
                              {request.extraLocations.map((location) => (
                                <Badge key={location.id} variant={location.approved ? "default" : "outline"} className="text-xs">
                                  {location.name} {!location.approved && "(Pending)"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
                          View Details
                        </Button>
                        
                        {/* Conditional action buttons based on user position and request status */}
                        {userPosition === 'Reporter' && request.status === 'Draft' && (
                          <Button size="sm" onClick={() => handleSubmitRequest(request.id)}>
                            Submit Request
                          </Button>
                        )}
                        
                        {canApproveRequest && request.status === 'Submitted' && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveRequest(request.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {canAssignEquipment && request.status === 'Admin Approved' && !request.equipmentAssigned && (
                          <Button size="sm" onClick={() => {
                            setSelectedRequest(request)
                            handleAssignEquipment()
                          }}>
                            Assign Equipment
                          </Button>
                        )}
                        
                        {canUpdateTripStatus && request.driverId === currentUser?.id && 
                         ['Admin Approved', 'Equipment Assigned', 'Trip Started'].includes(request.status) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                Update Trip Status
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Started')}>
                                Start Trip
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Arrived')}>
                                Arrived
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Waiting')}>
                                Waiting
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Returning')}>
                                Returning
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Returned')}>
                                Returned to Office
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        
                        {canAssignEquipment && request.status === 'Trip Returned' && !request.equipmentReturned && (
                          <Button size="sm" onClick={() => handleConfirmEquipmentReturn(request.id)}>
                            Confirm Equipment Return
                          </Button>
                        )}
                        
                        {canFinishRequest && request.status === 'Equipment Returned' && (
                          <Button size="sm" onClick={() => handleFinishRequest(request.id)}>
                            Finish Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No shooting requests found</h3>
              <p className="text-muted-foreground">
                {canCreateRequest 
                  ? "Get started by creating a new shooting request" 
                  : "No requests match your criteria"}
              </p>
              {canCreateRequest && (
                <Button className="mt-4" onClick={handleCreateRequest}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Request
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {filteredRequests.filter(req => ['Submitted', 'Admin Approved'].includes(req.status)).length > 0 ? (
            filteredRequests
              .filter(req => ['Submitted', 'Admin Approved'].includes(req.status))
              .map((request) => {
                const reporter = getUserById(request.reporterId)
                const initiator = getUserById(request.initiatorId)
                
                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Camera className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{request.projectTitle}</h3>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(request.shootingDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{request.mainLocation}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>Reporter: {reporter.name}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
                            View Details
                          </Button>
                          
                          {canApproveRequest && request.status === 'Submitted' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveRequest(request.id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {canAssignEquipment && request.status === 'Admin Approved' && !request.equipmentAssigned && (
                            <Button size="sm" onClick={() => {
                              setSelectedRequest(request)
                              handleAssignEquipment()
                            }}>
                              Assign Equipment
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No pending requests</h3>
              <p className="text-muted-foreground">There are no requests pending approval or assignment</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {filteredRequests.filter(req => ['Equipment Assigned', 'Trip Started', 'Trip Returned'].includes(req.status)).length > 0 ? (
            filteredRequests
              .filter(req => ['Equipment Assigned', 'Trip Started', 'Trip Returned'].includes(req.status))
              .map((request) => {
                const reporter = getUserById(request.reporterId)
                const driver = request.driverId ? getUserById(request.driverId) : null
                const vehicle = driver ? getVehicleByDriverId(driver.id) : null
                
                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Camera className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{request.projectTitle}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                                {request.tripStatus && (
                                  <Badge className={getTripStatusColor(request.tripStatus)}>
                                    Trip: {request.tripStatus}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(request.shootingDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{request.mainLocation}</span>
                            </div>
                            {driver && (
                              <div className="flex items-center space-x-2">
                                <Car className="w-4 h-4 text-muted-foreground" />
                                <span>Driver: {driver.name}</span>
                              </div>
                            )}
                            {vehicle && (
                              <div className="flex items-center space-x-2">
                                <Car className="w-4 h-4 text-muted-foreground" />
                                <span>Vehicle: {vehicle.name} ({vehicle.licensePlate})</span>
                              </div>
                            )}
                          </div>
                          
                          {request.extraLocations.filter(loc => loc.approved).length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">Approved Locations:</span>
                              <div className="flex flex-wrap gap-1">
                                {request.extraLocations
                                  .filter(location => location.approved)
                                  .map((location) => (
                                    <Badge key={location.id} variant="default" className="text-xs">
                                      {location.name}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
                            View Details
                          </Button>
                          
                          {canUpdateTripStatus && request.driverId === currentUser?.id && 
                           ['Admin Approved', 'Equipment Assigned', 'Trip Started'].includes(request.status) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  Update Trip Status
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Started')}>
                                  Start Trip
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Arrived')}>
                                  Arrived
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Waiting')}>
                                  Waiting
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Returning')}>
                                  Returning
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateTripStatus(request.id, 'Returned')}>
                                  Returned to Office
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          
                          {canAssignEquipment && request.status === 'Trip Returned' && !request.equipmentReturned && (
                            <Button size="sm" onClick={() => handleConfirmEquipmentReturn(request.id)}>
                              Confirm Equipment Return
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          ) : (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No active trips</h3>
              <p className="text-muted-foreground">There are no active shooting trips at the moment</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredRequests.filter(req => ['Equipment Returned', 'Finished'].includes(req.status)).length > 0 ? (
            filteredRequests
              .filter(req => ['Equipment Returned', 'Finished'].includes(req.status))
              .map((request) => {
                const reporter = getUserById(request.reporterId)
                const initiator = getUserById(request.initiatorId)
                
                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Camera className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{request.projectTitle}</h3>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(request.shootingDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{request.mainLocation}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>Reporter: {reporter.name}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewRequest(request)}>
                            View Details
                          </Button>
                          
                          {canFinishRequest && request.status === 'Equipment Returned' && (
                            <Button size="sm" onClick={() => handleFinishRequest(request.id)}>
                              Finish Request
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm" onClick={() => {
                            toast({
                              title: "Export PDF",
                              description: "Exporting request details as PDF...",
                            })
                          }}>
                            <FileText className="w-4 h-4 mr-2" />
                            Export PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No completed requests</h3>
              <p className="text-muted-foreground">There are no completed shooting requests</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Shooting Request</DialogTitle>
            <DialogDescription>
              Create a new shooting request with project details and requirements
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">Project Title *</Label>
              <Input 
                id="projectTitle" 
                placeholder="Enter project title" 
                value={newRequest.projectTitle}
                onChange={(e) => setNewRequest({...newRequest, projectTitle: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shootingDate">Shooting Date *</Label>
              <Input 
                id="shootingDate" 
                type="date" 
                value={newRequest.shootingDate}
                onChange={(e) => setNewRequest({...newRequest, shootingDate: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="mainLocation">Main Location *</Label>
              <Input 
                id="mainLocation" 
                placeholder="Enter main shooting location" 
                value={newRequest.mainLocation}
                onChange={(e) => setNewRequest({...newRequest, mainLocation: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfCameramen">Number of Cameramen *</Label>
              <Select 
                value={newRequest.numberOfCameramen?.toString()}
                onValueChange={(value) => setNewRequest({...newRequest, numberOfCameramen: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number" />
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
              <Select 
                value={newRequest.initiatorId}
                onValueChange={(value) => setNewRequest({...newRequest, initiatorId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select initiator" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers
                    .filter(user => user.position === 'Initiator')
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Enter additional notes or requirements" 
                value={newRequest.notes}
                onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRequest}>
              Create Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedRequest.projectTitle}</DialogTitle>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <DialogDescription>
                  Shooting request details and workflow
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Request Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Shooting Date</Label>
                          <p className="font-medium">{new Date(selectedRequest.shootingDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Number of Cameramen</Label>
                          <p className="font-medium">{selectedRequest.numberOfCameramen}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm text-muted-foreground">Main Location</Label>
                          <p className="font-medium">{selectedRequest.mainLocation}</p>
                        </div>
                        
                        {selectedRequest.extraLocations.length > 0 && (
                          <div className="col-span-2">
                            <Label className="text-sm text-muted-foreground">Extra Locations</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedRequest.extraLocations.map((location) => (
                                <div key={location.id} className="flex items-center">
                                  <Badge variant={location.approved ? "default" : "outline"} className="text-xs">
                                    {location.name}
                                  </Badge>
                                  {!location.approved && canApproveRequest && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-5 w-5 p-0 ml-1"
                                      onClick={() => handleApproveLocation(selectedRequest.id, location.id)}
                                    >
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedRequest.notes && (
                          <div className="col-span-2">
                            <Label className="text-sm text-muted-foreground">Notes</Label>
                            <p className="font-medium">{selectedRequest.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">People & Equipment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={getUserById(selectedRequest.reporterId).avatar} />
                            <AvatarFallback>
                              {getUserById(selectedRequest.reporterId).name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getUserById(selectedRequest.reporterId).name}</p>
                            <p className="text-xs text-muted-foreground">Reporter</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={getUserById(selectedRequest.initiatorId).avatar} />
                            <AvatarFallback>
                              {getUserById(selectedRequest.initiatorId).name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getUserById(selectedRequest.initiatorId).name}</p>
                            <p className="text-xs text-muted-foreground">Initiator</p>
                          </div>
                        </div>
                        
                        {selectedRequest.driverId && (
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={getUserById(selectedRequest.driverId).avatar} />
                              <AvatarFallback>
                                {getUserById(selectedRequest.driverId).name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{getUserById(selectedRequest.driverId).name}</p>
                              <p className="text-xs text-muted-foreground">Driver</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedRequest.driverId && getVehicleByDriverId(selectedRequest.driverId) && (
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {getVehicleByDriverId(selectedRequest.driverId)?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getVehicleByDriverId(selectedRequest.driverId)?.licensePlate}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedRequest.equipmentAssigned && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Equipment</Label>
                            <div className="space-y-2 mt-1">
                              {Array.from({ length: selectedRequest.numberOfCameramen }).map((_, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="font-medium">Camera Equipment Set {index + 1}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {selectedRequest.equipmentReturned ? 'Returned' : 'Assigned'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Timeline and Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Request Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Request Created</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(selectedRequest.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {selectedRequest.status !== 'Draft' && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Request Submitted</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(selectedRequest.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {['Admin Approved', 'Equipment Assigned', 'Trip Started', 'Trip Returned', 'Equipment Returned', 'Finished'].includes(selectedRequest.status) && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Request Approved</p>
                              <p className="text-xs text-muted-foreground">
                                Admin approved the request
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedRequest.status === 'Rejected' && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                              <XCircle className="w-3 h-3 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium">Request Rejected</p>
                              <p className="text-xs text-muted-foreground">
                                Admin rejected the request
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {['Equipment Assigned', 'Trip Started', 'Trip Returned', 'Equipment Returned', 'Finished'].includes(selectedRequest.status) && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">Equipment Assigned</p>
                              <p className="text-xs text-muted-foreground">
                                Equipment department assigned necessary equipment
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {['Trip Started', 'Trip Returned', 'Equipment Returned', 'Finished'].includes(selectedRequest.status) && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium">Trip Started</p>
                              <p className="text-xs text-muted-foreground">
                                Driver started the trip
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {['Trip Returned', 'Equipment Returned', 'Finished'].includes(selectedRequest.status) && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium">Trip Returned</p>
                              <p className="text-xs text-muted-foreground">
                                Driver returned to office
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {['Equipment Returned', 'Finished'].includes(selectedRequest.status) && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium">Equipment Returned</p>
                              <p className="text-xs text-muted-foreground">
                                Equipment department confirmed equipment return
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedRequest.status === 'Finished' && (
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Request Finished</p>
                              <p className="text-xs text-muted-foreground">
                                Reporter finalized the request
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {userPosition === 'Reporter' && selectedRequest.status === 'Draft' && (
                        <Button className="w-full" onClick={() => handleSubmitRequest(selectedRequest.id)}>
                          Submit Request
                        </Button>
                      )}
                      
                      {userPosition === 'Reporter' && ['Draft', 'Submitted'].includes(selectedRequest.status) && (
                        <Button className="w-full" variant="outline" onClick={() => handleAddLocation()}>
                          Add Extra Location
                        </Button>
                      )}
                      
                      {canApproveRequest && selectedRequest.status === 'Submitted' && (
                        <>
                          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleApproveRequest(selectedRequest.id)}>
                            Approve Request
                          </Button>
                          <Button className="w-full" variant="destructive" onClick={() => handleRejectRequest(selectedRequest.id)}>
                            Reject Request
                          </Button>
                        </>
                      )}
                      
                      {canApproveRequest && selectedRequest.status === 'Admin Approved' && !selectedRequest.driverId && (
                        <Button className="w-full" onClick={() => handleAssignDriver()}>
                          Assign Driver
                        </Button>
                      )}
                      
                      {canAssignEquipment && selectedRequest.status === 'Admin Approved' && !selectedRequest.equipmentAssigned && (
                        <Button className="w-full" onClick={() => handleAssignEquipment()}>
                          Assign Equipment
                        </Button>
                      )}
                      
                      {canUpdateTripStatus && selectedRequest.driverId === currentUser?.id && 
                       ['Admin Approved', 'Equipment Assigned', 'Trip Started'].includes(selectedRequest.status) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="w-full">
                              Update Trip Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleUpdateTripStatus(selectedRequest.id, 'Started')}>
                              Start Trip
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTripStatus(selectedRequest.id, 'Arrived')}>
                              Arrived
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTripStatus(selectedRequest.id, 'Waiting')}>
                              Waiting
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTripStatus(selectedRequest.id, 'Returning')}>
                              Returning
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTripStatus(selectedRequest.id, 'Returned')}>
                              Returned to Office
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      
                      {canAssignEquipment && selectedRequest.status === 'Trip Returned' && !selectedRequest.equipmentReturned && (
                        <Button className="w-full" onClick={() => handleConfirmEquipmentReturn(selectedRequest.id)}>
                          Confirm Equipment Return
                        </Button>
                      )}
                      
                      {canFinishRequest && selectedRequest.status === 'Equipment Returned' && (
                        <Button className="w-full" onClick={() => handleFinishRequest(selectedRequest.id)}>
                          Finish Request
                        </Button>
                      )}
                      
                      <Button className="w-full" variant="outline" onClick={() => {
                        toast({
                          title: "Export PDF",
                          description: "Exporting request details as PDF...",
                        })
                      }}>
                        <FileText className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                      
                      {userPosition === 'Reporter' && selectedRequest.status === 'Draft' && (
                        <Button className="w-full" variant="destructive" onClick={() => {
                          handleDeleteRequest(selectedRequest.id)
                          setIsViewDialogOpen(false)
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Request
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog open={isAddLocationDialogOpen} onOpenChange={setIsAddLocationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Extra Location</DialogTitle>
            <DialogDescription>
              Add an additional shooting location that requires approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name *</Label>
              <Input 
                id="locationName" 
                placeholder="Enter location name" 
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddLocationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLocation}>
              Add Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDriverDialogOpen} onOpenChange={setIsAssignDriverDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Assign a driver to the shooting request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Select Driver *</Label>
              <Select 
                value={selectedDriver}
                onValueChange={setSelectedDriver}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers
                    .filter(user => user.position === 'Driver')
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {getVehicleByDriverId(user.id)?.name || 'No vehicle'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedDriver && getVehicleByDriverId(selectedDriver) && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Vehicle Information</h4>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Vehicle:</span> {getVehicleByDriverId(selectedDriver)?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">License Plate:</span> {getVehicleByDriverId(selectedDriver)?.licensePlate}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAssignDriverDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDriver}>
              Assign Driver
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Equipment Dialog */}
      <Dialog open={isAssignEquipmentDialogOpen} onOpenChange={setIsAssignEquipmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Equipment</DialogTitle>
            <DialogDescription>
              Assign equipment for the shooting request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Request Information</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Project:</span> {selectedRequest?.projectTitle}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Date:</span> {selectedRequest?.shootingDate && new Date(selectedRequest.shootingDate).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Number of Cameramen:</span> {selectedRequest?.numberOfCameramen}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Equipment Sets</Label>
              <div className="space-y-4">
                {selectedRequest && Array.from({ length: selectedRequest.numberOfCameramen }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Camera Set {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">Camera Equipment</p>
                            <p className="text-xs text-muted-foreground">Standard camera set</p>
                          </div>
                        </div>
                        <Select defaultValue="1">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Sony FS7</SelectItem>
                            <SelectItem value="2">Canon C300</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">Audio Equipment</p>
                            <p className="text-xs text-muted-foreground">Microphones and audio gear</p>
                          </div>
                        </div>
                        <Select defaultValue="3">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">Sennheiser Wireless Mic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">Lighting</p>
                            <p className="text-xs text-muted-foreground">Lighting equipment</p>
                          </div>
                        </div>
                        <Select defaultValue="4">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">Aputure 300D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAssignEquipmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignEquipmentComplete}>
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[250px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="adminApproved">Admin Approved</SelectItem>
              <SelectItem value="equipmentAssigned">Equipment Assigned</SelectItem>
              <SelectItem value="tripStarted">Trip Started</SelectItem>
              <SelectItem value="tripReturned">Trip Returned</SelectItem>
              <SelectItem value="equipmentReturned">Equipment Returned</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Only Reporters can create new requests */}
        {userPosition === 'Reporter' && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{request.projectTitle}</h3>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{new Date(request.shootingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{request.mainLocation}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{request.numberOfCameramen} cameramen</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedRequest(request)
                        setIsViewDialogOpen(true)
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No requests found</h3>
              <p className="text-muted-foreground">
                {userPosition === 'Reporter' 
                  ? "Create a new shooting request to get started" 
                  : "No shooting requests match your criteria"}
              </p>
              {userPosition === 'Reporter' && (
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          {/* Same content as "all" but filtered for pending requests */}
          {filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{request.projectTitle}</h3>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{new Date(request.shootingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{request.mainLocation}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{request.numberOfCameramen} cameramen</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedRequest(request)
                        setIsViewDialogOpen(true)
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No pending requests</h3>
              <p className="text-muted-foreground">
                All requests have been processed
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {/* Same content as "all" but filtered for completed requests */}
          {filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{request.projectTitle}</h3>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{new Date(request.shootingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{request.mainLocation}</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{request.numberOfCameramen} cameramen</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(request.status)}>
                        {formatStatus(request.status)}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedRequest(request)
                        setIsViewDialogOpen(true)
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No completed requests</h3>
              <p className="text-muted-foreground">
                Completed requests will appear here
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Create Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Shooting Request</DialogTitle>
            <DialogDescription>
              Create a new shooting request with details and requirements
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const data = {
              projectTitle: formData.get('projectTitle') as string,
              shootingDate: formData.get('shootingDate') as string,
              mainLocation: formData.get('mainLocation') as string,
              numberOfCameramen: formData.get('numberOfCameramen') as string,
              notes: formData.get('notes') as string,
              initiatorId: formData.get('initiatorId') as string
            }
            handleCreateRequest(data)
          }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project Title</Label>
                <Input id="projectTitle" name="projectTitle" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shootingDate">Shooting Date</Label>
                <Input id="shootingDate" name="shootingDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mainLocation">Main Location</Label>
                <Input id="mainLocation" name="mainLocation" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfCameramen">Number of Cameramen</Label>
                <Select name="numberOfCameramen" defaultValue="1">
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
                <Label htmlFor="initiatorId">Initiator</Label>
                <Select name="initiatorId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select initiator" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.filter(u => u.position === 'Initiator').map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" name="notes" />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Request</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Request Dialog */}
      {selectedRequest && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedRequest.projectTitle}</DialogTitle>
              <DialogDescription>
                Shooting request details and management
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {formatStatus(selectedRequest.status)}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Shooting Date</h3>
                  <p>{new Date(selectedRequest.shootingDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Main Location</h3>
                  <p>{selectedRequest.mainLocation}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Number of Cameramen</h3>
                  <p>{selectedRequest.numberOfCameramen}</p>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <h3 className="text-sm font-medium">Notes</h3>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Initiator</h3>
                  <p>{mockUsers.find(u => u.id === selectedRequest.initiatorId)?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Reporter</h3>
                  <p>{currentUser?.name || 'John Smith'}</p>
                </div>
                {selectedRequest.driverId && (
                  <div>
                    <h3 className="text-sm font-medium">Driver</h3>
                    <p>{mockUsers.find(u => u.id === selectedRequest.driverId)?.name || 'Unknown'}</p>
                  </div>
                )}
                {selectedRequest.tripStatus && (
                  <div>
                    <h3 className="text-sm font-medium">Trip Status</h3>
                    <p>{formatTripStatus(selectedRequest.tripStatus)}</p>
                  </div>
                )}
                {selectedRequest.vehicleId && (
                  <div>
                    <h3 className="text-sm font-medium">Vehicle</h3>
                    <p>{vehicles.find(v => v.id === selectedRequest.vehicleId)?.model || 'Unknown'} ({vehicles.find(v => v.id === selectedRequest.vehicleId)?.licensePlate || 'Unknown'})</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Extra Locations Section */}
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Extra Locations</h3>
              {getExtraLocationsForRequest(selectedRequest.id).length > 0 ? (
                <div className="space-y-2">
                  {getExtraLocationsForRequest(selectedRequest.id).map(location => (
                    <div key={location.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{location.name}</span>
                      <div className="flex items-center">
                        <Badge variant={location.isApproved ? "default" : "outline"}>
                          {location.isApproved ? "Approved" : "Pending"}
                        </Badge>
                        {userPosition === 'Admin' && !location.isApproved && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleApproveExtraLocation(location.id)}
                            className="ml-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No extra locations added</p>
              )}
              
              {/* Add Extra Location (Reporter only) */}
              {userPosition === 'Reporter' && 
               selectedRequest.status !== 'finished' && 
               selectedRequest.status !== 'rejected' && (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const locationName = formData.get('locationName') as string
                  if (locationName) {
                    handleAddExtraLocation(selectedRequest.id, locationName)
                    e.currentTarget.reset()
                  }
                }} className="mt-2 flex space-x-2">
                  <Input name="locationName" placeholder="Add extra location" />
                  <Button type="submit" size="sm">Add</Button>
                </form>
              )}
            </div>
            
            {/* Assigned Equipment Section */}
            {(selectedRequest.status === 'equipmentAssigned' || 
              selectedRequest.status === 'tripStarted' || 
              selectedRequest.status === 'tripReturned' || 
              selectedRequest.status === 'equipmentReturned' || 
              selectedRequest.status === 'finished') && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Assigned Equipment</h3>
                {getAssignedEquipmentForRequest(selectedRequest.id).length > 0 ? (
                  <div className="space-y-2">
                    {getAssignedEquipmentForRequest(selectedRequest.id).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <span>{item.name} ({item.type})</span>
                        {item.isReturned && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Returned
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No equipment assigned yet</p>
                )}
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-2">
              {/* Reporter Actions */}
              {userPosition === 'Reporter' && (
                <>
                  {selectedRequest.status === 'draft' && (
                    <Button onClick={() => {
                      handleSubmitRequest(selectedRequest.id)
                      setIsViewDialogOpen(false)
                    }}>
                      Submit for Approval
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'equipmentReturned' && (
                    <Button onClick={() => {
                      handleFinalizeRequest(selectedRequest.id)
                      setIsViewDialogOpen(false)
                    }}>
                      Finalize Request
                    </Button>
                  )}
                </>
              )}
              
              {/* Admin Actions */}
              {(userPosition === 'Admin' || userPosition === 'Head of Reporters') && selectedRequest.status === 'submitted' && (
                <>
                  <Button variant="destructive" onClick={() => {
                    handleRejectRequest(selectedRequest.id)
                    setIsViewDialogOpen(false)
                  }}>
                    Reject
                  </Button>
                  
                  <Button onClick={() => {
                    // Show driver selection dialog
                    const driverId = mockUsers.find(u => u.position === 'Driver')?.id || '5'
                    handleApproveRequest(selectedRequest.id, driverId)
                    setIsViewDialogOpen(false)
                  }}>
                    Approve & Assign Driver
                  </Button>
                </>
              )}
              
              {/* Equipment Department Actions */}
              {userPosition === 'Equipment Department' && (
                <>
                  {selectedRequest.status === 'adminApproved' && (
                    <Button onClick={() => {
                      // Show equipment selection dialog
                      const availableEquipment = equipment.filter(e => !e.isAssigned).slice(0, selectedRequest.numberOfCameramen)
                      handleAssignEquipment(selectedRequest.id, availableEquipment.map(e => e.id))
                      setIsViewDialogOpen(false)
                    }}>
                      Assign Equipment
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'tripReturned' && (
                    <Button onClick={() => {
                      handleConfirmEquipmentReturn(selectedRequest.id)
                      setIsViewDialogOpen(false)
                    }}>
                      Confirm Equipment Return
                    </Button>
                  )}
                </>
              )}
              
              {/* Driver Actions */}
              {userPosition === 'Driver' && selectedRequest.status === 'equipmentAssigned' && (
                <Button onClick={() => {
                  // Update trip status based on current status
                  const currentStatus = selectedRequest.tripStatus || 'notStarted'
                  let nextStatus = 'started'
                  
                  if (currentStatus === 'started') nextStatus = 'arrived'
                  else if (currentStatus === 'arrived') nextStatus = 'waiting'
                  else if (currentStatus === 'waiting') nextStatus = 'returningToOffice'
                  else if (currentStatus === 'returningToOffice') nextStatus = 'returned'
                  
                  handleUpdateTripStatus(selectedRequest.id, nextStatus)
                  setIsViewDialogOpen(false)
                }}>
                  Update Trip Status
                </Button>
              )}
              
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}