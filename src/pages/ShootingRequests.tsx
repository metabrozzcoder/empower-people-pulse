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
  Search,
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
]

export default function ShootingRequests() {
  // ... rest of the component implementation
}