import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Search, Plus, Inbox, Send, File, Folder, Clock, Tag, MoreHorizontal, Download, Trash2, Edit, Eye, CheckCircle, XCircle, Upload, FileIcon, File as FilePdf, FileText as FileTextIcon, UserPlus, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Document {
  id: string
  title: string
  description: string
  category: string
  status: 'Draft' | 'Sent' | 'Pending' | 'Approved' | 'Declined'
  createdAt: string
  updatedAt: string
  tags: string[]
  fileType: 'pdf' | 'doc' | 'docx' | 'txt'
  fileSize: string
  fileUrl?: string
  author: string,
  assignedTo?: string
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Employee Handbook 2024',
    description: 'Official employee handbook with company policies and procedures',
    category: 'HR Policies',
    status: 'Approved',
    createdAt: '2024-01-10T09:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    tags: ['policy', 'handbook', 'official'],
    fileType: 'pdf',
    fileSize: '2.4 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    author: 'Sarah Wilson',
    assignedTo: 'John Smith'
  },
  {
    id: '2',
    title: 'Production Equipment Guidelines',
    description: 'Guidelines for using and maintaining production equipment',
    category: 'Technical',
    status: 'Pending',
    createdAt: '2024-01-12T11:45:00Z',
    updatedAt: '2024-01-12T11:45:00Z',
    tags: ['equipment', 'guidelines', 'technical'],
    fileType: 'docx',
    fileSize: '1.8 MB',
    author: 'John Smith',
    assignedTo: 'Sarah Wilson'
  },
  {
    id: '3',
    title: 'Content Creation Standards',
    description: 'Standards and best practices for content creation',
    category: 'Content',
    status: 'Draft',
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    tags: ['content', 'standards', 'guidelines'],
    fileType: 'doc',
    fileSize: '1.2 MB',
    author: 'Emily Davis',
    assignedTo: 'Mike Johnson'
  },
  {
    id: '4',
    title: 'Quarterly Budget Report',
    description: 'Q1 2024 budget report and financial analysis',
    category: 'Finance',
    status: 'Sent',
    createdAt: '2024-01-05T10:15:00Z',
    updatedAt: '2024-01-05T10:15:00Z',
    tags: ['finance', 'budget', 'report'],
    fileType: 'pdf',
    fileSize: '3.5 MB',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    author: 'Michael Johnson',
    assignedTo: 'Lisa Wang'
  },
  {
    id: '5',
    title: 'Marketing Campaign Proposal',
    description: 'Proposal for Q2 marketing campaign strategy',
    category: 'Marketing',
    status: 'Declined',
    createdAt: '2024-01-08T13:40:00Z',
    updatedAt: '2024-01-11T09:25:00Z',
    tags: ['marketing', 'proposal', 'campaign'],
    fileType: 'docx',
    fileSize: '2.1 MB',
    author: 'Lisa Wang',
    assignedTo: 'Emily Davis'
  }
]

const categories = [
  'HR Policies',
  'Technical',
  'Content',
  'Finance',
  'Marketing',
  'Legal',
  'Operations'
]

const users = [
  { id: '1', name: 'Sarah Wilson', role: 'Admin' },
  { id: '2', name: 'John Smith', role: 'HR Manager' },
  { id: '3', name: 'Emily Davis', role: 'Content Manager' },
  { id: '4', name: 'Mike Johnson', role: 'Technical Lead' },
  { id: '5', name: 'Lisa Wang', role: 'Marketing Director' }
]

export default function Documentation() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)
  const [isViewDocumentOpen, setIsViewDocumentOpen] = useState(false)
  const [isEditDocumentOpen, setIsEditDocumentOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [newDocument, setNewDocument] = useState<Partial<Document>>({
    title: '',
    description: '',
    category: '',
    tags: [],
    status: 'Draft',
    assignedTo: ''
  })
  const [tagInput, setTagInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus
    
    const matchesFolder = 
      selectedFolder === 'all' ||
      (selectedFolder === 'inbox' && doc.status === 'Pending') ||
      (selectedFolder === 'sent' && doc.status === 'Sent') ||
      (selectedFolder === 'drafts' && doc.status === 'Draft')
    
    return matchesSearch && matchesCategory && matchesStatus && matchesFolder
  })

  const folderCounts = {
    inbox: documents.filter(doc => doc.status === 'Pending').length,
    sent: documents.filter(doc => doc.status === 'Sent').length,
    drafts: documents.filter(doc => doc.status === 'Draft').length,
    all: documents.length
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Sent': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Declined': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileIcon = (fileType: Document['fileType']) => {
    switch (fileType) {
      case 'pdf': return FilePdf
      case 'doc':
      case 'docx': return FileTextIcon
      case 'txt': return FileText
      default: return FileIcon
    }
  }

  const handleAddDocument = () => {
    setNewDocument({
      title: '',
      description: '',
      category: '',
      tags: [],
      status: 'Draft'
    })
    setTagInput('')
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsAddDocumentOpen(true)
  }

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsViewDocumentOpen(true)
  }

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setNewDocument({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      tags: doc.tags ? [...doc.tags] : [],
      status: doc.status,
      assignedTo: doc.assignedTo || ''
    })
    setTagInput('')
    setIsEditDocumentOpen(true)
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    toast({
      title: "Document Deleted",
      description: "Document has been successfully deleted.",
    })
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !newDocument.tags?.includes(tagInput.trim())) {
      setNewDocument({
        ...newDocument,
        tags: [...(newDocument.tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setNewDocument({
      ...newDocument,
      tags: newDocument.tags?.filter(t => t !== tag)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
        variant: "destructive"
      })
      return
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'doc', 'docx', 'txt'].includes(fileExtension || '')) {
      toast({
        title: "Unsupported File Type",
        description: "Only PDF, DOC, DOCX, and TXT files are supported.",
        variant: "destructive"
      })
      return
    }

    setSelectedFile(file)
    
    // Create preview URL for PDF files
    if (fileExtension === 'pdf') {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    toast({
      title: "File Selected",
      description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    })
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
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileDelete = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    
    toast({
      title: "File Removed",
      description: "The uploaded file has been removed.",
    })
  }

  const handleSaveDocument = () => {
    if (!newDocument.title || !newDocument.category) {
      toast({
        title: "Validation Error",
        description: "Title and category are required.",
        variant: "destructive"
      })
      return
    }

    if (!selectedFile && !selectedDocument?.fileUrl) {
      toast({
        title: "Validation Error",
        description: "Please upload a document file.",
        variant: "destructive"
      })
      return
    }

    // If no assignee is selected, set status to Draft
    if (!newDocument.assignedTo || newDocument.assignedTo === "none") {
      newDocument.status = 'Draft';
    }

    const fileExtension = selectedFile 
      ? selectedFile.name.split('.').pop()?.toLowerCase() as Document['fileType']
      : selectedDocument?.fileType || 'pdf'

    if (selectedDocument) {
      // Update existing document
      const updatedDoc: Document = {
        ...selectedDocument,
        title: newDocument.title || selectedDocument.title,
        description: newDocument.description || selectedDocument.description,
        category: newDocument.category || selectedDocument.category,
        tags: newDocument.tags || selectedDocument.tags,
        assignedTo: newDocument.assignedTo || selectedDocument.assignedTo,
        status: newDocument.status || selectedDocument.status,
        updatedAt: new Date().toISOString(),
        fileType: fileExtension,
        fileSize: selectedFile 
          ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` 
          : selectedDocument.fileSize,
        fileUrl: selectedFile 
          ? URL.createObjectURL(selectedFile) 
          : selectedDocument.fileUrl
      }

      setDocuments(documents.map(doc => 
        doc.id === selectedDocument.id ? updatedDoc : doc
      ))

      toast({
        title: "Document Updated",
        description: "Document has been successfully updated.",
      })
    } else {
      // Create new document
      const newDoc: Document = {
        id: Date.now().toString(),
        title: newDocument.title || '',
        description: newDocument.description || '',
        category: newDocument.category || '',
        status: newDocument.status as Document['status'] || 'Draft',
        assignedTo: newDocument.assignedTo || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: newDocument.tags || [],
        fileType: fileExtension,
        fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
        fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
        author: 'Current User'
      }

      setDocuments([...documents, newDoc])

      toast({
        title: "Document Created",
        description: "Document has been successfully created.",
      })
    }

    setIsAddDocumentOpen(false)
    setIsEditDocumentOpen(false)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleUpdateStatus = (doc: Document, newStatus: Document['status']) => {
    const updatedDoc = {
      ...doc,
      status: newStatus,
      updatedAt: new Date().toISOString()
    }

    setDocuments(documents.map(d => 
      d.id === doc.id ? updatedDoc : d
    ))

    toast({
      title: "Status Updated",
      description: `Document status changed to ${newStatus}.`,
    })

    if (isViewDocumentOpen) {
      setSelectedDocument(updatedDoc)
    }
  }

  const handleDownloadDocument = (doc: Document) => {
    if (doc.fileUrl) {
      const link = document.createElement('a')
      link.href = doc.fileUrl
      link.download = `${doc.title}.${doc.fileType}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Document Downloaded",
        description: `${doc.title} has been downloaded.`,
      })
    } else {
      toast({
        title: "Download Failed",
        description: "Document file is not available.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Manage, share, and access important documents and files
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <Button 
                className="w-full" 
                onClick={handleAddDocument}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>

              <div className="space-y-1">
                <div 
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedFolder === 'all' ? 'bg-accent' : ''}`}
                  onClick={() => setSelectedFolder('all')}
                >
                  <div className="flex items-center">
                    <Folder className="mr-2 h-4 w-4" />
                    <span>All Documents</span>
                  </div>
                  <Badge variant="secondary">{folderCounts.all}</Badge>
                </div>
                <div 
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedFolder === 'inbox' ? 'bg-accent' : ''}`}
                  onClick={() => setSelectedFolder('inbox')}
                >
                  <div className="flex items-center">
                    <Inbox className="mr-2 h-4 w-4" />
                    <span>Inbox</span>
                  </div>
                  <Badge variant="secondary">{folderCounts.inbox}</Badge>
                </div>
                <div 
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedFolder === 'sent' ? 'bg-accent' : ''}`}
                  onClick={() => setSelectedFolder('sent')}
                >
                  <div className="flex items-center">
                    <Send className="mr-2 h-4 w-4" />
                    <span>Sent</span>
                  </div>
                  <Badge variant="secondary">{folderCounts.sent}</Badge>
                </div>
                <div 
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedFolder === 'drafts' ? 'bg-accent' : ''}`}
                  onClick={() => setSelectedFolder('drafts')}
                >
                  <div className="flex items-center">
                    <File className="mr-2 h-4 w-4" />
                    <span>Drafts</span>
                  </div>
                  <Badge variant="secondary">{folderCounts.drafts}</Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="mb-2 text-sm font-medium">Categories</h3>
                <div className="space-y-1">
                  <div 
                    className={`px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedCategory === 'all' ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </div>
                  {categories.map(category => (
                    <div 
                      key={category}
                      className={`px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedCategory === category ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="mb-2 text-sm font-medium">Status</h3>
                <div className="space-y-1">
                  <div 
                    className={`px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedStatus === 'all' ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedStatus('all')}
                  >
                    All Status
                  </div>
                  {['Draft', 'Sent', 'Pending', 'Approved', 'Declined'].map(status => (
                    <div 
                      key={status}
                      className={`px-3 py-2 rounded-md cursor-pointer hover:bg-accent ${selectedStatus === status ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    {selectedFolder === 'all' 
                      ? 'All documents' 
                      : selectedFolder === 'inbox' 
                        ? 'Documents pending your review' 
                        : selectedFolder === 'sent' 
                          ? 'Documents you have sent' 
                          : 'Draft documents'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                  <Button onClick={handleAddDocument}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => {
                    const FileTypeIcon = getFileIcon(doc.fileType)
                    return (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileTypeIcon className="h-8 w-8 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-medium">{doc.title}</h3>
                                <p className="text-sm text-muted-foreground">{doc.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center">
                                    <FileText className="mr-1 h-3 w-3" />
                                    <span>{doc.fileType.toUpperCase()} • {doc.fileSize}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 h-3 w-3" />
                                    <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Tag className="mr-1 h-3 w-3" />
                                    <span>{doc.category}</span>
                                </div>
                                {doc.assignedTo && (
                                  <div className="flex items-center">
                                    <User className="mr-1 h-3 w-3" />
                                    <span>Assigned to: {doc.assignedTo}</span>
                                  </div>
                                )}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <Badge className={getStatusColor(doc.status)}>
                                    {doc.status}
                                  </Badge>
                                  {doc.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDocument(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditDocument(doc)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                  {doc.status === 'Draft' && (
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(doc, 'Sent')}>
                                      <Send className="mr-2 h-4 w-4" />
                                      Send for Approval
                                    </DropdownMenuItem>
                                  )}
                                  {doc.status === 'Pending' && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(doc, 'Approved')}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(doc, 'Declined')}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Decline
                                      </DropdownMenuItem>
                                    </>
                                  )}
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
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? "Try adjusting your search or filters" 
                        : "Get started by creating a new document"}
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={handleAddDocument}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Document
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Document Dialog */}
      <Dialog 
        open={isAddDocumentOpen || isEditDocumentOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDocumentOpen(false)
            setIsEditDocumentOpen(false)
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl)
              setPreviewUrl(null)
            }
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDocumentOpen ? 'Edit Document' : 'Add New Document'}
            </DialogTitle>
            <DialogDescription>
              {isEditDocumentOpen 
                ? 'Update document details and content' 
                : 'Create a new document with details and file upload'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Document Details</TabsTrigger>
              <TabsTrigger value="file">File Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter document title" 
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter document description" 
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={newDocument.category} 
                    onValueChange={(value) => setNewDocument({...newDocument, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  {isEditDocumentOpen && (
                    <>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newDocument.status} 
                        onValueChange={(value) => setNewDocument({...newDocument, status: value as Document['status']})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Sent">Sent</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select 
                    value={newDocument.assignedTo || "none"} 
                    onValueChange={(value) => setNewDocument({...newDocument, assignedTo: value === "none" ? "" : value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user to assign (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Save as Draft)</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Add tag" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newDocument.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <span>{tag}</span>
                        <button 
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 h-4 w-4 rounded-full bg-muted-foreground/20 inline-flex items-center justify-center hover:bg-muted-foreground/30"
                        >
                          <span className="sr-only">Remove</span>
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="file" className="space-y-4 py-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  key={selectedFile ? 'file-selected' : 'no-file'}
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                />
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {selectedFile ? (
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    ) : (
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {selectedFile ? 'File Selected' : 'Upload Document'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedFile 
                        ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)` 
                        : 'Drag and drop your file here or click to browse'}
                    </p>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {selectedFile ? 'Change File' : 'Select File'}
                    </Button>
                    
                    {selectedFile && (
                      <Button 
                        type="button" 
                        variant="destructive"
                        onClick={handleFileDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove File
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* File Preview */}
              {(previewUrl || (selectedDocument?.fileUrl && isEditDocumentOpen)) && (
                <div className="mt-4 border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Document Preview</h3>
                  
                  {/* PDF Preview */}
                  {((selectedFile && selectedFile.type === 'application/pdf') || 
                     (!selectedFile && selectedDocument?.fileType === 'pdf')) && (
                    <div className="h-96 border rounded">
                      <iframe 
                        src={previewUrl || selectedDocument?.fileUrl} 
                        className="w-full h-full" 
                        title="PDF Preview"
                      />
                    </div>
                  )}
                  
                  {/* Word Document Preview (not directly supported in browser) */}
                  {((selectedFile && ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) ||
                     (!selectedFile && ['doc', 'docx'].includes(selectedDocument?.fileType || ''))) && (
                    <div className="h-96 border rounded flex items-center justify-center bg-muted/20">
                      <div className="text-center p-6">
                        <FileTextIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-medium">Word Document Preview</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          Preview not available for Word documents. Please download to view.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Text File Preview */}
                  {((selectedFile && selectedFile.type === 'text/plain') || 
                     (!selectedFile && selectedDocument?.fileType === 'txt')) && (
                    <div className="h-96 border rounded p-4 overflow-auto bg-muted/20 font-mono text-sm">
                      {/* Text content would be loaded here */}
                      <p>Text file content preview would appear here.</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>Supported file types: PDF, DOC, DOCX, TXT</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => {
                setIsAddDocumentOpen(false)
                setIsEditDocumentOpen(false)
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveDocument}>
              {isEditDocumentOpen ? 'Update' : (newDocument.assignedTo ? 'Send' : 'Save as Draft')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog 
        open={isViewDocumentOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsViewDocumentOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{selectedDocument.title}</DialogTitle>
                  <Badge className={getStatusColor(selectedDocument.status)}>
                    {selectedDocument.status}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedDocument.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                {/* Document Preview */}
                <div className="md:col-span-2 space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Document Preview</h3>
                    
                    {/* PDF Preview */}
                    {selectedDocument.fileType === 'pdf' && selectedDocument.fileUrl && (
                      <div className="h-[500px] border rounded">
                        <iframe 
                          src={selectedDocument.fileUrl} 
                          className="w-full h-full" 
                          title="PDF Preview"
                        />
                      </div>
                    )}
                    
                    {/* Word Document Preview */}
                    {['doc', 'docx'].includes(selectedDocument.fileType) && (
                      <div className="h-[500px] border rounded flex items-center justify-center bg-muted/20">
                        <div className="text-center p-6">
                          <FileTextIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h4 className="text-lg font-medium">Word Document Preview</h4>
                          <p className="text-sm text-muted-foreground mt-2">
                            Preview not available for Word documents. Please download to view.
                          </p>
                          <Button 
                            className="mt-4" 
                            onClick={() => handleDownloadDocument(selectedDocument)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Document
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Text File Preview */}
                    {selectedDocument.fileType === 'txt' && (
                      <div className="h-[500px] border rounded p-4 overflow-auto bg-muted/20 font-mono text-sm">
                        <p>Text file content preview would appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Document Information */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Document Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                        <p>{selectedDocument.category}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">File Type</h4>
                        <p>{selectedDocument.fileType.toUpperCase()}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">File Size</h4>
                        <p>{selectedDocument.fileSize}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                        <p>{new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
                        <p>{new Date(selectedDocument.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Author</h4>
                        <p>{selectedDocument.author}</p>
                      </div>
                      {selectedDocument.assignedTo && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Assigned To</h4>
                          <p>{selectedDocument.assignedTo}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedDocument.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleDownloadDocument(selectedDocument)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsViewDocumentOpen(false)
                          handleEditDocument(selectedDocument)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                    
                    {selectedDocument.status === 'Draft' && (
                      <Button 
                        className="w-full" 
                        onClick={() => handleUpdateStatus(selectedDocument, 'Sent')}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send for Approval
                      </Button>
                    )}
                    
                    {selectedDocument.status === 'Pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="default" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateStatus(selectedDocument, 'Approved')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="default"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleUpdateStatus(selectedDocument, 'Declined')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    )}
                    
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        handleDeleteDocument(selectedDocument.id)
                        setIsViewDocumentOpen(false)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Document
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}