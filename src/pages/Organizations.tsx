
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Search, Users, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Organization {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  employeeCount: number
  departments: string[]
  status: 'Active' | 'Inactive'
  createdDate: string
}

const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'MediaTech Solutions',
    description: 'Digital media and technology solutions company',
    address: '123 Tech Street, San Francisco, CA 94105',
    phone: '+1 (555) 123-4567',
    email: 'contact@mediatech.com',
    employeeCount: 150,
    departments: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'],
    status: 'Active',
    createdDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Creative Studios',
    description: 'Creative design and content production studio',
    address: '456 Creative Ave, Los Angeles, CA 90210',
    phone: '+1 (555) 987-6543',
    email: 'hello@creativestudios.com',
    employeeCount: 75,
    departments: ['Creative', 'Production', 'Client Services'],
    status: 'Active',
    createdDate: '2023-03-20'
  }
]

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddOrganization = () => {
    setSelectedOrg(null)
    setIsDialogOpen(true)
  }

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrg(org)
    setIsDialogOpen(true)
  }

  const handleDeleteOrganization = (id: string) => {
    setOrganizations(organizations.filter(org => org.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage your organization structure and details</p>
        </div>
        <Button onClick={handleAddOrganization} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <Badge variant={org.status === 'Active' ? 'default' : 'secondary'}>
                      {org.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditOrganization(org)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOrganization(org.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription>{org.description}</CardDescription>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{org.address}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{org.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{org.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{org.employeeCount} employees</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Departments</div>
                <div className="flex flex-wrap gap-1">
                  {org.departments.map((dept) => (
                    <Badge key={dept} variant="outline" className="text-xs">
                      {dept}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? 'Edit Organization' : 'Add New Organization'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" placeholder="Enter organization name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter organization description" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" placeholder="Enter organization address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter phone number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>
              {selectedOrg ? 'Update' : 'Create'} Organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
