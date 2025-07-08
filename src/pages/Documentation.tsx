import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  FileImage,
  File,
  FileType,
  PenTool,
  Clock,
  User,
  Tag,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  X,
  Users,
  FileSearch,
  MessageSquare,
  Filter,
  Inbox,
  Archive,
  Reply,
  Forward
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  name: string
  type: 'pdf' | 'word' | 'image' | 'text'
  category: string
  size: string
  uploadedBy: string
  uploadDate: string
  status: 'draft' | 'pending_signature' | 'signed' | 'declined' | 'archived'
  signers?: Signer[]
  tags: string[]
  description?: string
  extractedText?: string
  recipients?: string[]
  file?: File
  previewUrl?: string
}

interface CompanyMember {
  id: string
  name: string
  email: string
  department: string
  role: string
}

interface Signer {
  id: string
  name: string
  email: string
  status: 'pending' | 'signed' | 'declined'
  signedDate?: string
}

interface DocumentComment {
  id: string
  author: string
  message: string
  timestamp: string
  avatar?: string
}

interface MailboxDocument {
  id: string
  title: string
  type: 'contract' | 'agreement' | 'policy' | 'other'
  status: 'signed' | 'pending' | 'not_signed' | 'draft'
  sender: string
  recipient: string
  sentDate: string
  dueDate?: string
  description: string
  comments: DocumentComment[]
  fileUrl?: string
  priority?: 'high' | 'medium' | 'low'
  read?: boolean
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Employee Handbook 2024.pdf',
    type: 'pdf',
    category: 'HR Policies',
    size: '2.4 MB',
    uploadedBy: 'Sarah Wilson',
    uploadDate: '2024-01-15',
    status: 'signed',
    tags: ['handbook', 'policies', '2024'],
    description: 'Updated employee handbook for 2024',
    extractedText: 'Employee Handbook 2024\n\nSection 1: Introduction\nWelcome to our company...',
    signers: [
      { id: '1', name: 'John Smith', email: 'john@company.com', status: 'signed', signedDate: '2024-01-16' },
      { id: '2', name: 'Emily Davis', email: 'emily@company.com', status: 'signed', signedDate: '2024-01-17' }
    ]
  },
  {
    id: '2',
    name: 'Contract Template.docx',
    type: 'word',
    category: 'Legal',
    size: '156 KB',
    uploadedBy: 'Mike Johnson',
    uploadDate: '2024-01-14',
    status: 'pending_signature',
    tags: ['contract', 'template', 'legal'],
    description: 'Standard employment contract template',
    extractedText: 'Employment Contract\n\nThis agreement is between...',
    signers: [
      { id: '3', name: 'Alex Brown', email: 'alex@company.com', status: 'pending' },
      { id: '4', name: 'Lisa Wang', email: 'lisa@company.com', status: 'signed', signedDate: '2024-01-15' }
    ]
  },
  {
    id: '3',
    name: 'Office Layout.png',
    type: 'image',
    category: 'Facilities',
    size: '890 KB',
    uploadedBy: 'David Chen',
    uploadDate: '2024-01-13',
    status: 'draft',
    tags: ['office', 'layout', 'facilities'],
    description: 'New office layout design',
    extractedText: 'Floor Plan\nEntrance\nReception Area\nOffice Spaces 1-20\nMeeting Rooms A-D\nKitchen\nBreak Room'
  }
]

const mockMailboxDocuments: MailboxDocument[] = [
  {
    id: '1',
    title: 'Employment Contract - John Doe',
    type: 'contract',
    status: 'pending',
    sender: 'HR Department',
    recipient: 'John Doe',
    sentDate: '2024-01-15',
    dueDate: '2024-01-22',
    description: 'Standard employment contract for new hire requiring immediate signature.',
    priority: 'high',
    read: false,
    comments: [
      {
        id: '1',
        author: 'HR Manager',
        message: 'Please review section 3 regarding benefits',
        timestamp: '2024-01-16 10:30'
      }
    ]
  },
  {
    id: '2',
    title: 'Non-Disclosure Agreement',
    type: 'agreement',
    status: 'signed',
    sender: 'Legal Department',
    recipient: 'Sarah Wilson',
    sentDate: '2024-01-10',
    description: 'Standard NDA for all employees - completed and filed.',
    priority: 'medium',
    read: true,
    comments: []
  },
  {
    id: '3',
    title: 'Remote Work Policy Update',
    type: 'policy',
    status: 'draft',
    sender: 'You',
    recipient: 'All Employees',
    sentDate: '',
    description: 'Updated remote work guidelines pending final review.',
    priority: 'low',
    read: true,
    comments: []
  }
]

const categories = ['All', 'HR Policies', 'Legal', 'Facilities', 'Training', 'Finance', 'Custom']
const predefinedTags = ['vacation', 'report', 'request', 'contract', 'handbook', 'invoice', 'custom']

const mockCompanyMembers: CompanyMember[] = [
  { id: '1', name: 'John Smith', email: 'john@company.com', department: 'Engineering', role: 'Senior Developer' },
  { id: '2', name: 'Emily Davis', email: 'emily@company.com', department: 'HR', role: 'HR Manager' },
  { id: '3', name: 'Alex Brown', email: 'alex@company.com', department: 'Legal', role: 'Legal Counsel' },
  { id: '4', name: 'Lisa Wang', email: 'lisa@company.com', department: 'Finance', role: 'CFO' },
  { id: '5', name: 'Sarah Wilson', email: 'sarah@company.com', department: 'HR', role: 'HR Director' },
  { id: '6', name: 'Mike Johnson', email: 'mike@company.com', department: 'Legal', role: 'Contracts Manager' },
  { id: '7', name: 'David Chen', email: 'david@company.com', department: 'Operations', role: 'Operations Manager' }
]

const DocumentMailbox = () => {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<MailboxDocument[]>(mockMailboxDocuments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedDocument, setSelectedDocument] = useState<MailboxDocument | null>(documents[0])
  const [newComment, setNewComment] = useState("")

  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      return matchesSearch && matchesStatus
    })

    // Apply tab filtering
    if (activeTab === "sent") {
      filtered = filtered.filter(doc => doc.sender === 'You' || doc.sender.includes('Department'))
    } else if (activeTab === "received") {
      filtered = filtered.filter(doc => doc.recipient === 'You')
    } else if (activeTab === "drafts") {
      filtered = filtered.filter(doc => doc.status === 'draft')
    }

    return filtered
  }, [documents, searchTerm, statusFilter, activeTab])

  const getStatusBadge = (status: string) => {
    const variants = {
      signed: "default",
      pending: "secondary",
      not_signed: "destructive",
      draft: "outline"
    } as const
    
    const labels = {
      signed: "Signed",
      pending: "Pending",
      not_signed: "Not Signed",
      draft: "Draft"
    }
    
    return (
      <Badge variant={variants[status as keyof typeof variants]} className="text-xs">
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'not_signed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'draft': return <Edit className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const addComment = () => {
    if (!selectedDocument || !newComment.trim()) return

    const comment: DocumentComment = {
      id: Date.now().toString(),
      author: 'You',
      message: newComment,
      timestamp: new Date().toLocaleString()
    }

    const updatedDocuments = documents.map(doc => 
      doc.id === selectedDocument.id 
        ? { ...doc, comments: [...doc.comments, comment] }
        : doc
    )

    setDocuments(updatedDocuments)
    setSelectedDocument({
      ...selectedDocument,
      comments: [...selectedDocument.comments, comment]
    })
    setNewComment("")
    
    toast({
      title: "Comment Added",
      description: "Your comment has been added to the document.",
    })
  }

  const signDocument = (docId: string) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === docId ? { ...doc, status: 'signed' as const } : doc
    )
    setDocuments(updatedDocuments)
    
    if (selectedDocument?.id === docId) {
      setSelectedDocument({ ...selectedDocument, status: 'signed' })
    }
    
    toast({
      title: "Document Signed",
      description: "The document has been successfully signed.",
    })
  }

  const markAsRead = (docId: string) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === docId ? { ...doc, read: true } : doc
    )
    setDocuments(updatedDocuments)
  }

  const selectDocument = (document: MailboxDocument) => {
    setSelectedDocument(document)
    if (!document.read) {
      markAsRead(document.id)
    }
  }

  return (
    <div className="flex h-[600px] bg-background border rounded-lg">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold mb-4">Document Mailbox</h3>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="not_signed">Not Signed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[
              { id: 'all', label: 'All', icon: Inbox },
              { id: 'sent', label: 'Sent', icon: Send },
              { id: 'received', label: 'Inbox', icon: Archive },
              { id: 'drafts', label: 'Drafts', icon: Edit }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded transition-all",
                  activeTab === tab.id 
                    ? "bg-background text-foreground shadow-sm font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <ScrollArea className="h-[calc(100%-12rem)]">
          <div className="p-2">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                onClick={() => selectDocument(document)}
                className={cn(
                  "p-3 mb-1 rounded-lg cursor-pointer transition-all border-l-4 hover:bg-accent/50",
                  selectedDocument?.id === document.id 
                    ? "bg-accent border-l-primary" 
                    : getPriorityColor(document.priority),
                  !document.read && "bg-accent/30"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(document.status)}
                    <h4 className={cn(
                      "font-medium text-sm truncate max-w-[200px]",
                      !document.read && "font-semibold"
                    )}>
                      {document.title}
                    </h4>
                  </div>
                  {!document.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {document.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {document.sender}
                  </span>
                  <div className="flex items-center gap-1">
                    {document.comments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-xs">{document.comments.length}</span>
                      </div>
                    )}
                    {getStatusBadge(document.status)}
                  </div>
                </div>
                
                {document.sentDate && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {document.sentDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedDocument ? (
          <>
            {/* Document Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(selectedDocument.status)}
                    <h2 className="text-xl font-bold">{selectedDocument.title}</h2>
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                  <p className="text-muted-foreground text-sm">{selectedDocument.description}</p>
                </div>
              </div>

              {/* Document Meta */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg mb-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">FROM</Label>
                  <p className="font-medium text-sm">{selectedDocument.sender}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">TO</Label>
                  <p className="font-medium text-sm">{selectedDocument.recipient}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">SENT</Label>
                  <p className="font-medium text-sm">{selectedDocument.sentDate || 'Draft'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">DUE</Label>
                  <p className="font-medium text-sm">{selectedDocument.dueDate || 'No due date'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {selectedDocument.status === 'pending' && (
                  <Button size="sm" onClick={() => signDocument(selectedDocument.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign Document
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
                <Button variant="outline" size="sm">
                  <Forward className="w-4 h-4 mr-2" />
                  Forward
                </Button>
              </div>
            </div>

            {/* Document Content & Comments */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Document Preview */}
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Document Content</span>
                  </div>
                  <div className="bg-background p-4 rounded border min-h-[150px]">
                    <p className="text-sm text-muted-foreground">
                      Document content preview would be displayed here...
                    </p>
                  </div>
                </div>

                {/* Comments Thread */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments ({selectedDocument.comments.length})
                  </h4>
                  
                  {selectedDocument.comments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDocument.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback>
                              {comment.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm">{comment.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="border-t pt-4">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Write your comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button onClick={addComment} disabled={!newComment.trim()} size="sm">
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h4 className="text-lg font-medium mb-2">No document selected</h4>
              <p className="text-sm">Choose a document from the sidebar to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Documentation() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadType, setUploadType] = useState<'sign' | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadFormData, setUploadFormData] = useState({
    category: '',
    description: '',
    tags: '',
    recipients: ''
  })
  const [selectedSigners, setSelectedSigners] = useState<string[]>([])
  const [newSigners, setNewSigners] = useState([{ name: '', email: '' }])

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.extractedText && doc.extractedText.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return File
      case 'word': return FileType
      case 'image': return FileImage
      default: return FileText
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'draft': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      case 'pending_signature': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'signed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getSignerStatusIcon = (status: Signer['status']) => {
    switch (status) {
      case 'signed': return CheckCircle
      case 'declined': return XCircle
      default: return AlertCircle
    }
  }

  const handleFileProcessing = async () => {
    if (!selectedFile || !uploadType) return
    
    setIsProcessing(true)
    setOcrProgress(0)
    
    // Simulate processing with real progress
    const progressInterval = setInterval(() => {
      setOcrProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      setOcrProgress(100)
      
      // Create signers array from selected company members
      const docSigners = selectedSigners.map(signerId => {
        const member = mockCompanyMembers.find(m => m.id === signerId)
        return member ? {
          id: member.id,
          name: member.name,
          email: member.email,
          status: 'pending' as const
        } : null
      }).filter(Boolean) as Signer[]
      
      const newDoc: Document = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: selectedFile.type.includes('pdf') ? 'pdf' : 
              selectedFile.type.includes('word') ? 'word' : 
              selectedFile.type.includes('image') ? 'image' : 'text',
        category: uploadFormData.category || 'Custom',
        size: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: 'Current User',
        uploadDate: new Date().toISOString().split('T')[0],
        status: uploadType === 'sign' && docSigners.length > 0 ? 'pending_signature' : 'draft',
        tags: uploadFormData.tags ? uploadFormData.tags.split(',').map(t => t.trim()) : ['uploaded'],
        description: uploadFormData.description || 'Newly uploaded document',
        signers: uploadType === 'sign' ? docSigners : undefined,
        file: selectedFile,
        previewUrl: previewUrl || undefined
      }
      
      setDocuments([newDoc, ...documents])
      setIsProcessing(false)
      
      toast({
        title: "Document Sent for Signature",
        description: `${selectedFile.name} has been sent to ${docSigners.length} signers.`,
      })
      
      // Reset form and close dialog
      setIsUploadDialogOpen(false)
      setUploadType(null)
      setSelectedFile(null)
      setPreviewUrl(null)
      setSelectedSigners([])
      setUploadFormData({ category: '', description: '', tags: '', recipients: '' })
      
    } catch (error) {
      setIsProcessing(false)
      toast({
        title: "Processing Failed",
        description: "There was an error processing the document.",
      })
    }
  }

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsViewDialogOpen(true)
  }

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsEditDialogOpen(true)
  }

  const handleDownloadDocument = (doc: Document) => {
    // Simulate download
    toast({
      title: "Download Started",
      description: `Downloading ${doc.name}...`,
    })
  }

  const handleSendDocument = (doc: Document) => {
    if (!doc.signers || doc.signers.length === 0) {
      toast({
        title: "No Signers Selected",
        description: "Please select at least one signer before sending the document.",
        variant: "destructive"
      })
      return
    }
    
    setDocuments(documents.map(d => 
      d.id === doc.id 
        ? { ...d, status: 'pending_signature' as Document['status'] }
        : d
    ))
    
    toast({
      title: "Document Sent",
      description: `${doc.name} has been sent to ${doc.signers.length} signers.`,
    })
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    toast({
      title: "Document Deleted",
      description: "Document has been successfully deleted.",
    })
  }

  const addNewSigner = () => {
    setNewSigners([...newSigners, { name: '', email: '' }])
  }

  const removeSignerField = (index: number) => {
    if (newSigners.length > 1) {
      setNewSigners(newSigners.filter((_, i) => i !== index))
    }
  }

  const updateSignerField = (index: number, field: 'name' | 'email', value: string) => {
    setNewSigners(newSigners.map((signer, i) => 
      i === index ? { ...signer, [field]: value } : signer
    ))
  }

  const totalDocuments = documents.length
  const pendingSignatures = documents.filter(doc => doc.status === 'pending_signature').length
  const signedDocuments = documents.filter(doc => doc.status === 'signed').length
  const draftDocuments = documents.filter(doc => doc.status === 'draft').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <FileSearch className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Document Management
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced document processing with OCR technology, electronic signatures, and intelligent workflow management
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Button 
              size="lg" 
              onClick={() => setIsUploadDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{totalDocuments}</p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Documents</p>
                </div>
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{draftDocuments}</p>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-300">Draft Documents</p>
                </div>
                <Edit className="w-10 h-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{signedDocuments}</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-300">Signed Documents</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{pendingSignatures}</p>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Pending Signatures</p>
                </div>
                <PenTool className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-primary animate-pulse" />
                      <span className="font-medium">Processing Document...</span>
                    </div>
                    <span className="text-sm font-medium text-primary">{Math.round(ocrProgress)}%</span>
                  </div>
                  <Progress value={ocrProgress} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    Processing document for signatures...
                  </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="bg-gradient-to-r from-background to-muted/10">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search documents by name, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 h-12">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48 h-12">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_signature">Pending Signature</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.type)
            return (
              <Card key={doc.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-muted/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{doc.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {doc.category}
                          </Badge>
                          <Badge className={cn("text-xs", getStatusColor(doc.status))}>
                            {doc.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Size: {doc.size}</span>
                      <span>By: {doc.uploadedBy}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Uploaded: {doc.uploadDate}
                    </div>
                    
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {doc.signers && doc.signers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Signers ({doc.signers.length})</span>
                      </div>
                      <div className="space-y-1">
                        {doc.signers.slice(0, 2).map((signer) => {
                          const StatusIcon = getSignerStatusIcon(signer.status)
                          return (
                            <div key={signer.id} className="flex items-center gap-2">
                              <StatusIcon className="w-3 h-3" />
                              <span className="text-xs text-muted-foreground">{signer.name}</span>
                            </div>
                          )
                        })}
                        {doc.signers.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{doc.signers.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDocument(doc)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditDocument(doc)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <Card className="py-16 text-center">
            <CardContent>
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search criteria' : 'Start by uploading your first document'}
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Document Mailbox Section */}
        <div>
          <Separator className="my-12" />
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Document Mailbox
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manage document signatures, approvals, and communications in one central location
            </p>
          </div>
          <DocumentMailbox />
        </div>
      </div>
    </div>
  )
}