import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Search, Plus, Folder, File, MoreHorizontal, Download, Trash2, Edit, Clock, Tag, User, FileIcon, File as FilePdf, FileText as FileTextIcon, Send, Archive, CheckCircle, XCircle, AlertCircle, Inbox, PenTool } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// Document types
interface Document {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'sent' | 'pending' | 'approved' | 'declined'
  folder: 'inbox' | 'sent' | 'drafts' | 'all'
}

interface FileDocument extends Document {
  type: 'pdf' | 'word' | 'text'
  fileSize: string
  fileUrl?: string
  previewUrl?: string
}

// Mock data
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Employee Handbook 2024',
    description: 'Official company handbook with policies and procedures',
    category: 'Policy',
    tags: ['handbook', 'policy', 'official'],
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-10T09:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    status: 'approved',
    folder: 'all'
  },
  {
    id: '2',
    title: 'Onboarding Checklist',
    description: 'Checklist for new employee onboarding process',
    category: 'Process',
    tags: ['onboarding', 'checklist', 'new-hire'],
    createdBy: 'John Smith',
    createdAt: '2024-01-05T11:45:00Z',
    updatedAt: '2024-01-05T11:45:00Z',
    status: 'approved',
    folder: 'all'
  },
  {
    id: '3',
    title: 'Performance Review Template',
    description: 'Standard template for quarterly performance reviews',
    category: 'Template',
    tags: ['performance', 'review', 'template'],
    createdBy: 'Emily Davis',
    createdAt: '2024-01-12T15:20:00Z',
    updatedAt: '2024-01-12T15:20:00Z',
    status: 'pending',
    folder: 'inbox'
  },
  {
    id: '4',
    title: 'Benefits Overview',
    description: 'Summary of employee benefits and enrollment information',
    category: 'Policy',
    tags: ['benefits', 'insurance', 'compensation'],
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-08T10:15:00Z',
    updatedAt: '2024-01-08T10:15:00Z',
    status: 'draft',
    folder: 'drafts'
  },
  {
    id: '5',
    title: 'Remote Work Policy',
    description: 'Guidelines for remote work arrangements',
    category: 'Policy',
    tags: ['remote', 'work-from-home', 'policy'],
    createdBy: 'John Smith',
    createdAt: '2024-01-14T13:10:00Z',
    updatedAt: '2024-01-14T13:10:00Z',
    status: 'sent',
    folder: 'sent'
  }
]

const mockFileDocuments: FileDocument[] = [
  {
    id: '6',
    title: 'Q1 HR Budget Report',
    description: 'Financial report for HR department Q1 2024',
    category: 'Report',
    tags: ['finance', 'budget', 'quarterly'],
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
    status: 'approved',
    folder: 'all',
    type: 'pdf',
    fileSize: '2.4 MB',
    fileUrl: 'https://example.com/files/q1-budget.pdf',
    previewUrl: 'https://www.africau.edu/images/default/sample.pdf'
  },
  {
    id: '7',
    title: 'Employee Training Manual',
    description: 'Comprehensive training guide for new employees',
    category: 'Training',
    tags: ['training', 'manual', 'onboarding'],
    createdBy: 'John Smith',
    createdAt: '2024-01-15T14:45:00Z',
    updatedAt: '2024-01-15T14:45:00Z',
    status: 'pending',
    folder: 'inbox',
    type: 'word',
    fileSize: '3.8 MB',
    fileUrl: 'https://example.com/files/training-manual.docx'
  },
  {
    id: '8',
    title: 'Recruitment Strategy Document',
    description: 'Strategic plan for talent acquisition in 2024',
    category: 'Strategy',
    tags: ['recruitment', 'strategy', 'talent'],
    createdBy: 'Emily Davis',
    createdAt: '2024-01-14T11:20:00Z',
    updatedAt: '2024-01-14T11:20:00Z',
    status: 'draft',
    folder: 'drafts',
    type: 'word',
    fileSize: '1.7 MB',
    fileUrl: 'https://example.com/files/recruitment-strategy.docx'
  },
  {
    id: '9',
    title: 'Compliance Checklist 2024',
    description: 'Regulatory compliance requirements for HR',
    category: 'Compliance',
    tags: ['legal', 'compliance', 'regulations'],
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-13T10:15:00Z',
    updatedAt: '2024-01-13T10:15:00Z',
    status: 'sent',
    folder: 'sent',
    type: 'pdf',
    fileSize: '1.2 MB',
    fileUrl: 'https://example.com/files/compliance-checklist.pdf',
    previewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }
]

export default function Documentation() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'drafts' | 'all'>('all')
  
  const [isAddDocDialogOpen, setIsAddDocDialogOpen] = useState(false)
  const [isViewDocDialogOpen, setIsViewDocDialogOpen] = useState(false)
  const [isEditDocDialogOpen, setIsEditDocDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedFileDocument, setSelectedFileDocument] = useState<FileDocument | null>(null)
  
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [fileDocuments, setFileDocuments] = useState<FileDocument[]>(mockFileDocuments)
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  
  // Filter documents based on search, category, status, and folder
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus
    const matchesFolder = currentFolder === 'all' || doc.folder === currentFolder
    
    return matchesSearch && matchesCategory && matchesStatus && matchesFolder
  })
  
  const filteredFileDocuments = fileDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus
    const matchesFolder = currentFolder === 'all' || doc.folder === currentFolder
    
    return matchesSearch && matchesCategory && matchesStatus && matchesFolder
  })
  
  // Get unique categories from all documents
  const categories = Array.from(new Set([
    ...documents.map(doc => doc.category),
    ...fileDocuments.map(doc => doc.category)
  ])).sort()
  
  // Count documents in each folder
  const folderCounts = {
    inbox: documents.filter(doc => doc.folder === 'inbox').length + 
           fileDocuments.filter(doc => doc.folder === 'inbox').length,
    sent: documents.filter(doc => doc.folder === 'sent').length + 
          fileDocuments.filter(doc => doc.folder === 'sent').length,
    drafts: documents.filter(doc => doc.folder === 'drafts').length + 
            fileDocuments.filter(doc => doc.folder === 'drafts').length,
    all: documents.length + fileDocuments.length
  }
  
  const handleAddDocument = () => {
    setSelectedDocument(null)
    setIsAddDocDialogOpen(true)
  }
  
  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsViewDocDialogOpen(true)
  }
  
  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsEditDocDialogOpen(true)
  }
  
  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    setFileDocuments(fileDocuments.filter(doc => doc.id !== id))
    toast({
      title: "Document Deleted",
      description: "Document has been successfully deleted.",
    })
  }
  
  const handleSaveDocument = () => {
    if (selectedDocument) {
      // Update existing document
      setDocuments(documents.map(doc => 
        doc.id === selectedDocument.id ? selectedDocument : doc
      ))
      toast({
        title: "Document Updated",
        description: "Document has been successfully updated.",
      })
    } else {
      // Create new document
      const newDoc: Document = {
        id: Date.now().toString(),
        title: "New Document",
        description: "Document description",
        category: "Policy",
        tags: ["new"],
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        folder: 'drafts'
      }
      setDocuments([...documents, newDoc])
      toast({
        title: "Document Created",
        description: "New document has been successfully created.",
      })
    }
    setIsAddDocDialogOpen(false)
    setIsEditDocDialogOpen(false)
  }
  
  const handleUploadFile = () => {
    setUploadedFile(null)
    setIsUploadDialogOpen(true)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Maximum file size is 10MB.",
          variant: "destructive"
        })
        return
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF and Word documents are supported.",
          variant: "destructive"
        })
        return
      }
      
      setUploadedFile(file)
    }
  }
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Maximum file size is 10MB.",
          variant: "destructive"
        })
        return
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF and Word documents are supported.",
          variant: "destructive"
        })
        return
      }
      
      setUploadedFile(file)
    }
  }
  
  const handleUploadSubmit = () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      })
      return
    }
    
    // Determine file type
    let fileType: 'pdf' | 'word' | 'text' = 'text'
    if (uploadedFile.type === 'application/pdf') {
      fileType = 'pdf'
    } else if (uploadedFile.type.includes('word')) {
      fileType = 'word'
    }
    
    // Create file URL for preview (in a real app, this would be a server upload)
    const fileUrl = URL.createObjectURL(uploadedFile)
    
    // Create new file document
    const newFileDoc: FileDocument = {
      id: Date.now().toString(),
      title: uploadedFile.name.split('.')[0],
      description: "Uploaded document",
      category: "Uploaded",
      tags: ["uploaded"],
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      folder: 'drafts',
      type: fileType,
      fileSize: `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      fileUrl: fileUrl,
      previewUrl: fileType === 'pdf' ? fileUrl : undefined
    }
    
    setFileDocuments([...fileDocuments, newFileDoc])
    setIsUploadDialogOpen(false)
    
    toast({
      title: "File Uploaded",
      description: `${uploadedFile.name} has been successfully uploaded.`,
    })
  }
  
  const handleViewFile = (doc: FileDocument) => {
    setSelectedFileDocument(doc)
    setIsPreviewDialogOpen(true)
  }
  
  const handleDownloadFile = (doc: FileDocument) => {
    if (doc.fileUrl) {
      const a = document.createElement('a')
      a.href = doc.fileUrl
      a.download = doc.title
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      toast({
        title: "File Downloaded",
        description: `${doc.title} has been downloaded.`,
      })
    }
  }
  
  const handleMoveDocument = (docId: string, isFile: boolean, targetFolder: 'inbox' | 'sent' | 'drafts' | 'all') => {
    if (isFile) {
      setFileDocuments(fileDocuments.map(doc => 
        doc.id === docId ? { ...doc, folder: targetFolder } : doc
      ))
    } else {
      setDocuments(documents.map(doc => 
        doc.id === docId ? { ...doc, folder: targetFolder } : doc
      ))
    }
    
    toast({
      title: "Document Moved",
      description: `Document has been moved to ${targetFolder}.`,
    })
  }
  
  const handleChangeStatus = (docId: string, isFile: boolean, newStatus: Document['status']) => {
    if (isFile) {
      setFileDocuments(fileDocuments.map(doc => 
        doc.id === docId ? { ...doc, status: newStatus } : doc
      ))
    } else {
      setDocuments(documents.map(doc => 
        doc.id === docId ? { ...doc, status: newStatus } : doc
      ))
    }
    
    toast({
      title: "Status Updated",
      description: `Document status has been changed to ${newStatus}.`,
    })
  }
  
  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'draft': return <PenTool className="w-4 h-4" />
      case 'sent': return <Send className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'declined': return <XCircle className="w-4 h-4" />
      default: return <FileIcon className="w-4 h-4" />
    }
  }
  
  const getFileIcon = (type: FileDocument['type']) => {
    switch (type) {
      case 'pdf': return <FilePdf className="w-5 h-5 text-red-500" />
      case 'word': return <FileTextIcon className="w-5 h-5 text-blue-500" />
      default: return <FileIcon className="w-5 h-5 text-gray-500" />
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Manage and access all company documents and files
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Document Mailbox</h3>
              </div>
              
              <div className="space-y-1">
                <Button 
                  variant={currentFolder === 'inbox' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setCurrentFolder('inbox')}
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  <span>Inbox</span>
                  <Badge className="ml-auto" variant="outline">{folderCounts.inbox}</Badge>
                </Button>
                <Button 
                  variant={currentFolder === 'sent' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setCurrentFolder('sent')}
                >
                  <Send className="mr-2 h-4 w-4" />
                  <span>Sent</span>
                  <Badge className="ml-auto" variant="outline">{folderCounts.sent}</Badge>
                </Button>
                <Button 
                  variant={currentFolder === 'drafts' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setCurrentFolder('drafts')}
                >
                  <PenTool className="mr-2 h-4 w-4" />
                  <span>Drafts</span>
                  <Badge className="ml-auto" variant="outline">{folderCounts.drafts}</Badge>
                </Button>
                <Button 
                  variant={currentFolder === 'all' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setCurrentFolder('all')}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  <span>All Documents</span>
                  <Badge className="ml-auto" variant="outline">{folderCounts.all}</Badge>
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Categories</h3>
                <div className="space-y-1">
                  <Button 
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </Button>
                  {categories.map((category) => (
                    <Button 
                      key={category} 
                      variant={selectedCategory === category ? 'default' : 'ghost'} 
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Status</h3>
                <div className="space-y-1">
                  <Button 
                    variant={selectedStatus === 'all' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedStatus('all')}
                  >
                    All Status
                  </Button>
                  <Button 
                    variant={selectedStatus === 'draft' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedStatus('draft')}
                  >
                    <PenTool className="mr-2 h-3 w-3" />
                    Draft
                  </Button>
                  <Button 
                    variant={selectedStatus === 'sent' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedStatus('sent')}
                  >
                    <Send className="mr-2 h-3 w-3" />
                    Sent
                  </Button>
                  <Button 
                    variant={selectedStatus === 'pending' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedStatus('pending')}
                  >
                    <AlertCircle className="mr-2 h-3 w-3" />
                    Pending
                  </Button>
                  <Button 
                    variant={selectedStatus === 'approved' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedStatus('approved')}
                  >
                    <CheckCircle className="mr-2 h-3 w-3" />
                    Approved
                  </Button>
                  <Button 
                    variant={selectedStatus === 'declined' ? 'default' : 'ghost'} 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedStatus('declined')}
                  >
                    <XCircle className="mr-2 h-3 w-3" />
                    Declined
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <Button className="w-full" onClick={handleAddDocument}>
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
            <Button className="w-full" variant="outline" onClick={handleUploadFile}>
              <Plus className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {currentFolder === 'inbox' ? 'Inbox' : 
                 currentFolder === 'sent' ? 'Sent Documents' : 
                 currentFolder === 'drafts' ? 'Drafts' : 'All Documents'}
              </CardTitle>
              <CardDescription>
                {currentFolder === 'inbox' ? 'Documents requiring your attention' : 
                 currentFolder === 'sent' ? 'Documents you have sent' : 
                 currentFolder === 'drafts' ? 'Documents in progress' : 'Browse all documents'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.length === 0 && filteredFileDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents found</p>
                  </div>
                )}
                
                {/* Regular Documents */}
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{doc.title}</h3>
                          {getStatusBadge(doc.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{doc.createdBy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Tag className="h-3 w-3" />
                            <span>{doc.category}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDocument(doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            const content = `Title: ${doc.title}\nDescription: ${doc.description}\nCategory: ${doc.category}\nTags: ${doc.tags.join(', ')}\nCreated By: ${doc.createdBy}\nCreated At: ${new Date(doc.createdAt).toLocaleString()}\nStatus: ${doc.status}`
                            const blob = new Blob([content], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${doc.title.replace(/\s+/g, '_')}.txt`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                            
                            toast({
                              title: "Document Downloaded",
                              description: `${doc.title} has been downloaded.`,
                            })
                          }}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(doc.id, false, 'sent')}
                            disabled={doc.status === 'sent'}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send for Approval
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(doc.id, false, 'approved')}
                            disabled={doc.status === 'approved'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(doc.id, false, 'declined')}
                            disabled={doc.status === 'declined'}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleMoveDocument(doc.id, false, 'inbox')}
                            disabled={doc.folder === 'inbox'}
                          >
                            <Inbox className="mr-2 h-4 w-4" />
                            Move to Inbox
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleMoveDocument(doc.id, false, 'sent')}
                            disabled={doc.folder === 'sent'}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Move to Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleMoveDocument(doc.id, false, 'drafts')}
                            disabled={doc.folder === 'drafts'}
                          >
                            <PenTool className="mr-2 h-4 w-4" />
                            Move to Drafts
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                
                {/* File Documents */}
                {filteredFileDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{doc.title}</h3>
                          {getStatusBadge(doc.status)}
                          <Badge variant="outline" className="text-xs">
                            {doc.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{doc.createdBy}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <File className="h-3 w-3" />
                            <span>{doc.fileSize}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewFile(doc)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewFile(doc)}>
                            <FileText className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadFile(doc)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(doc.id, true, 'sent')}
                            disabled={doc.status === 'sent'}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send for Approval
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(doc.id, true, 'approved')}
                            disabled={doc.status === 'approved'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleChangeStatus(doc.id, true, 'declined')}
                            disabled={doc.status === 'declined'}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Decline
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleMoveDocument(doc.id, true, 'inbox')}
                            disabled={doc.folder === 'inbox'}
                          >
                            <Inbox className="mr-2 h-4 w-4" />
                            Move to Inbox
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleMoveDocument(doc.id, true, 'sent')}
                            disabled={doc.folder === 'sent'}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Move to Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleMoveDocument(doc.id, true, 'drafts')}
                            disabled={doc.folder === 'drafts'}
                          >
                            <PenTool className="mr-2 h-4 w-4" />
                            Move to Drafts
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add/Edit Document Dialog */}
      <Dialog open={isAddDocDialogOpen || isEditDocDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDocDialogOpen(false)
          setIsEditDocDialogOpen(false)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditDocDialogOpen ? 'Edit Document' : 'Create New Document'}
            </DialogTitle>
            <DialogDescription>
              {isEditDocDialogOpen ? 'Update document details' : 'Create a new document with details and metadata'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input 
                id="title" 
                placeholder="Enter document title" 
                value={selectedDocument?.title || ''}
                onChange={(e) => setSelectedDocument(prev => prev ? {...prev, title: e.target.value} : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={selectedDocument?.category || ''}
                onValueChange={(value) => setSelectedDocument(prev => prev ? {...prev, category: value} : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter document description" 
                value={selectedDocument?.description || ''}
                onChange={(e) => setSelectedDocument(prev => prev ? {...prev, description: e.target.value} : null)}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input 
                id="tags" 
                placeholder="policy, handbook, official" 
                value={selectedDocument?.tags.join(', ') || ''}
                onChange={(e) => {
                  const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  setSelectedDocument(prev => prev ? {...prev, tags: tagsArray} : null)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={selectedDocument?.status || 'draft'}
                onValueChange={(value: Document['status']) => setSelectedDocument(prev => prev ? {...prev, status: value} : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select 
                value={selectedDocument?.folder || 'drafts'}
                onValueChange={(value: 'inbox' | 'sent' | 'drafts' | 'all') => setSelectedDocument(prev => prev ? {...prev, folder: value} : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbox">Inbox</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="drafts">Drafts</SelectItem>
                  <SelectItem value="all">All Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Document Content Editor */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="content">Document Content</Label>
              <Textarea 
                id="content" 
                placeholder="Enter document content here..." 
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDocDialogOpen(false)
              setIsEditDocDialogOpen(false)
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveDocument}>
              {isEditDocDialogOpen ? 'Update' : 'Create'} Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Document Dialog */}
      <Dialog open={isViewDocDialogOpen} onOpenChange={setIsViewDocDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedDocument?.title}</DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{selectedDocument?.category}</Badge>
                  {selectedDocument && getStatusBadge(selectedDocument.status)}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                if (selectedDocument) {
                  handleEditDocument(selectedDocument)
                  setIsViewDocDialogOpen(false)
                }
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{selectedDocument?.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Metadata</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By:</span>
                    <span>{selectedDocument?.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created Date:</span>
                    <span>{selectedDocument ? new Date(selectedDocument.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{selectedDocument ? new Date(selectedDocument.updatedAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{selectedDocument?.status}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedDocument?.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">Document Content</h3>
              <div className="p-4 border rounded-lg bg-muted/20 min-h-[200px]">
                <p>This is a sample document content. In a real application, this would contain the actual document text or a rich text editor component.</p>
                <p className="mt-4">The document would typically include sections like:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Introduction</li>
                  <li>Main content sections</li>
                  <li>Policies or procedures</li>
                  <li>References and appendices</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDocDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              const content = `Title: ${selectedDocument?.title}\nDescription: ${selectedDocument?.description}\nCategory: ${selectedDocument?.category}\nTags: ${selectedDocument?.tags.join(', ')}\nCreated By: ${selectedDocument?.createdBy}\nCreated At: ${selectedDocument ? new Date(selectedDocument.createdAt).toLocaleString() : ''}\nStatus: ${selectedDocument?.status}`
              const blob = new Blob([content], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${selectedDocument?.title.replace(/\s+/g, '_')}.txt`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              
              toast({
                title: "Document Downloaded",
                description: `${selectedDocument?.title} has been downloaded.`,
              })
            }}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a PDF or Word document to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              
              {uploadedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    {uploadedFile.type === 'application/pdf' ? (
                      <FilePdf className="h-12 w-12 text-red-500" />
                    ) : (
                      <FileTextIcon className="h-12 w-12 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <File className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p>Drag and drop your file here or</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX (Max 10MB)
                  </p>
                </div>
              )}
            </div>
            
            {uploadedFile && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-title">Document Title</Label>
                  <Input 
                    id="upload-title" 
                    placeholder="Enter document title" 
                    defaultValue={uploadedFile.name.split('.')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-description">Description</Label>
                  <Textarea 
                    id="upload-description" 
                    placeholder="Enter document description" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-category">Category</Label>
                  <Select defaultValue="Uploaded">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem value="Uploaded">Uploaded</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-tags">Tags (comma separated)</Label>
                  <Input 
                    id="upload-tags" 
                    placeholder="uploaded, document, file" 
                    defaultValue="uploaded"
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUploadSubmit}
              disabled={!uploadedFile}
            >
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* File Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedFileDocument?.title}</DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{selectedFileDocument?.category}</Badge>
                  {selectedFileDocument && getStatusBadge(selectedFileDocument.status)}
                  <Badge variant="outline" className="text-xs">
                    {selectedFileDocument?.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDownloadFile(selectedFileDocument!)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">File Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Type:</span>
                    <span>{selectedFileDocument?.type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span>{selectedFileDocument?.fileSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By:</span>
                    <span>{selectedFileDocument?.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created Date:</span>
                    <span>{selectedFileDocument ? new Date(selectedFileDocument.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{selectedFileDocument?.status}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedFileDocument?.description}</p>
                
                <h3 className="font-medium mt-4 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {selectedFileDocument?.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">Document Preview</h3>
              <div className="border rounded-lg overflow-hidden bg-muted/20 h-[400px]">
                {selectedFileDocument?.type === 'pdf' && selectedFileDocument.previewUrl ? (
                  <iframe 
                    src={selectedFileDocument.previewUrl} 
                    className="w-full h-full"
                    title={selectedFileDocument.title}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    {getFileIcon(selectedFileDocument?.type || 'text')}
                    <p className="mt-4 text-muted-foreground">
                      {selectedFileDocument?.type === 'word' 
                        ? 'Word documents cannot be previewed in the browser. Please download to view.' 
                        : 'No preview available for this document type.'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => handleDownloadFile(selectedFileDocument!)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => {
                if (selectedFileDocument) {
                  handleChangeStatus(selectedFileDocument.id, true, 'approved')
                }
              }}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button variant="outline" onClick={() => {
                if (selectedFileDocument) {
                  handleChangeStatus(selectedFileDocument.id, true, 'declined')
                }
              }}>
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}