import React, { useState } from 'react'
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
  Forward,
  Sparkles,
  Zap,
  Shield,
  TrendingUp
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

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    
    // Apply tab filtering
    if (activeTab === "sent") {
      return matchesSearch && matchesStatus && (doc.sender === 'You' || doc.sender.includes('Department'))
    } else if (activeTab === "received") {
      return matchesSearch && matchesStatus && doc.recipient === 'You'
    } else if (activeTab === "drafts") {
      return matchesSearch && matchesStatus && doc.status === 'draft'
    }
    
    return matchesSearch && matchesStatus
  })

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
      <Badge variant={variants[status as keyof typeof variants]} className="text-xs font-medium">
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />
      case 'not_signed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'draft': return <Edit className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
      case 'medium': return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
      case 'low': return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
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
    <div className="flex h-[700px] bg-gradient-to-br from-background via-background to-muted/20 border border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
      {/* Sidebar */}
      <div className="w-80 border-r border-border/50 bg-muted/30 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Document Mailbox</h3>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/80 border-border/50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 bg-background/80 border-border/50">
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
            <Button size="sm" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
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
                  "flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg transition-all font-medium",
                  activeTab === tab.id 
                    ? "bg-background text-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        <ScrollArea className="h-[calc(100%-14rem)]">
          <div className="p-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                onClick={() => selectDocument(document)}
                className={cn(
                  "p-4 mb-2 rounded-xl cursor-pointer transition-all border-l-4 hover:shadow-md",
                  selectedDocument?.id === document.id 
                    ? "bg-primary/5 border-l-primary shadow-md" 
                    : getPriorityColor(document.priority),
                  !document.read && "bg-accent/30 shadow-sm"
                )}
              >
                <div className="flex items-start justify-between mb-3">
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
                
                <p className="text-xs text-muted-foreground truncate mb-3">
                  {document.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    {document.sender}
                  </span>
                  <div className="flex items-center gap-2">
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
                  <div className="text-xs text-muted-foreground mt-2 font-mono">
                    {document.sentDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-muted/5">
        {selectedDocument ? (
          <>
            {/* Document Header */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-background to-muted/5">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusIcon(selectedDocument.status)}
                    <h2 className="text-2xl font-bold">{selectedDocument.title}</h2>
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                  <p className="text-muted-foreground">{selectedDocument.description}</p>
                </div>
              </div>

              {/* Document Meta */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl mb-6">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</Label>
                  <p className="font-semibold text-sm mt-1">{selectedDocument.sender}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</Label>
                  <p className="font-semibold text-sm mt-1">{selectedDocument.recipient}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sent</Label>
                  <p className="font-semibold text-sm mt-1 font-mono">{selectedDocument.sentDate || 'Draft'}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due</Label>
                  <p className="font-semibold text-sm mt-1 font-mono">{selectedDocument.dueDate || 'No due date'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="hover:bg-primary/5">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {selectedDocument.status === 'pending' && (
                  <Button size="sm" onClick={() => signDocument(selectedDocument.id)} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign Document
                  </Button>
                )}
                <Button variant="outline" size="sm" className="hover:bg-primary/5">
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
                <Button variant="outline" size="sm" className="hover:bg-primary/5">
                  <Forward className="w-4 h-4 mr-2" />
                  Forward
                </Button>
              </div>
            </div>

            {/* Document Content & Comments */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                {/* Document Preview */}
                <div className="p-6 border border-border/50 rounded-xl bg-gradient-to-br from-muted/20 to-muted/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-lg">Document Content</span>
                  </div>
                  <div className="bg-background p-6 rounded-xl border border-border/50 min-h-[200px]">
                    <p className="text-muted-foreground">
                      Document content preview would be displayed here. This could include PDF preview, 
                      formatted text, or other document formats with syntax highlighting and interactive elements.
                    </p>
                  </div>
                </div>

                {/* Comments Thread */}
                <div className="space-y-6">
                  <h4 className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    Comments & Discussion ({selectedDocument.comments.length})
                  </h4>
                  
                  {selectedDocument.comments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto mb-4">
                        <MessageSquare className="w-12 h-12 opacity-50" />
                      </div>
                      <p className="text-lg font-medium mb-2">No comments yet</p>
                      <p>Start the conversation by adding the first comment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDocument.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {comment.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold">{comment.author}</span>
                              <span className="text-sm text-muted-foreground font-mono">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{comment.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="border-t border-border/50 pt-6">
                    <div className="flex gap-4">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Write your comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[100px] bg-background border-border/50"
                        />
                        <div className="mt-3 flex justify-end">
                          <Button onClick={addComment} disabled={!newComment.trim()} className="bg-primary/90 hover:bg-primary">
                            <Send className="w-4 h-4 mr-2" />
                            Send Comment
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
              <div className="p-6 bg-muted/20 rounded-full w-fit mx-auto mb-6">
                <FileText className="w-16 h-16 opacity-50" />
              </div>
              <h4 className="text-xl font-semibold mb-3">No document selected</h4>
              <p>Choose a document from the sidebar to view its details and manage signatures</p>
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
      case 'draft': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800'
      case 'pending_signature': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800'
      case 'signed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
      case 'declined': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
      case 'archived': return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800'
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800'
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
        title: "Document Processed Successfully",
        description: `${selectedFile.name} has been uploaded and is ready for signatures.`,
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
        variant: "destructive"
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
    toast({
      title: "Download Started",
      description: `Downloading ${doc.name}...`,
    })
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    toast({
      title: "Document Deleted",
      description: "Document has been successfully deleted.",
    })
  }

  const totalDocuments = documents.length
  const pendingSignatures = documents.filter(doc => doc.status === 'pending_signature').length
  const signedDocuments = documents.filter(doc => doc.status === 'signed').length
  const draftDocuments = documents.filter(doc => doc.status === 'draft').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      
      <div className="relative container mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl animate-pulse" />
            <FileSearch className="w-10 h-10 text-primary relative z-10" />
            <Sparkles className="w-4 h-4 text-primary/60 absolute -top-1 -right-1" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
              Intelligent Document Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced document management with AI-powered OCR technology, secure electronic signatures, 
              and intelligent workflow automation for the modern workplace
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button 
              size="lg" 
              onClick={() => setIsUploadDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-base font-semibold"
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload & Process Document
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary/20 hover:bg-primary/5 px-8 py-3 text-base font-semibold"
            >
              <Zap className="w-5 h-5 mr-3" />
              AI Quick Scan
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/50 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/30 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">{totalDocuments}</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">Total Documents</p>
                  <p className="text-xs text-blue-500/70 mt-1">+12% this month</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100/50 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/30 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mb-1">{draftDocuments}</p>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">Draft Documents</p>
                  <p className="text-xs text-amber-500/70 mt-1">Ready for review</p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Edit className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100/50 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">{signedDocuments}</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">Signed Documents</p>
                  <p className="text-xs text-emerald-500/70 mt-1">98% completion rate</p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/50 dark:from-purple-950/30 dark:via-purple-950/20 dark:to-purple-900/10 border-purple-200/50 dark:border-purple-800/30 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-1">{pendingSignatures}</p>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-300">Pending Signatures</p>
                  <p className="text-xs text-purple-500/70 mt-1">Avg. 2.3 days</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <PenTool className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <Card className="relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
            <CardContent className="p-8 relative">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-2xl animate-pulse">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold">Processing Document with AI</span>
                      <p className="text-muted-foreground">Extracting text, analyzing content, and preparing for signatures...</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-primary">{Math.round(ocrProgress)}%</span>
                </div>
                <Progress value={ocrProgress} className="h-4 bg-primary/10" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Search and Filters */}
        <Card className="relative bg-gradient-to-r from-background via-background to-muted/5 border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/2 to-transparent" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search documents by name, content, tags, or use AI semantic search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-base bg-background/80 border-border/50 focus:border-primary/50"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                    <Zap className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-56 h-14 bg-background/80 border-border/50">
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
                  <SelectTrigger className="w-56 h-14 bg-background/80 border-border/50">
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

        {/* Enhanced Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.type)
            return (
              <Card key={doc.id} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-background via-background to-muted/5 border-border/50 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-4 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <FileIcon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 font-semibold group-hover:text-primary transition-colors duration-300">{doc.name}</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {doc.category}
                          </Badge>
                          <Badge className={cn("text-xs font-medium border", getStatusColor(doc.status))}>
                            {doc.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 relative">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="font-medium">Size: {doc.size}</span>
                      <span className="font-medium">By: {doc.uploadedBy}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      Uploaded: {doc.uploadDate}
                    </div>
                    
                    {doc.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}
                    
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs font-medium bg-muted/50">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs font-medium bg-muted/50">
                            +{doc.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {doc.signers && doc.signers.length > 0 && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Signers ({doc.signers.length})</span>
                      </div>
                      <div className="space-y-2">
                        {doc.signers.slice(0, 2).map((signer) => {
                          const StatusIcon = getSignerStatusIcon(signer.status)
                          return (
                            <div key={signer.id} className="flex items-center gap-3">
                              <StatusIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">{signer.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {signer.status}
                              </Badge>
                            </div>
                          )
                        })}
                        {doc.signers.length > 2 && (
                          <div className="text-sm text-muted-foreground font-medium">
                            +{doc.signers.length - 2} more signers
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDocument(doc)}
                      className="flex-1 hover:bg-primary/5 hover:border-primary/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadDocument(doc)}
                      className="hover:bg-primary/5 hover:border-primary/20"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditDocument(doc)}
                      className="hover:bg-primary/5 hover:border-primary/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
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
          <Card className="py-20 text-center bg-gradient-to-br from-background to-muted/5 border-border/50">
            <CardContent>
              <div className="p-6 bg-muted/20 rounded-full w-fit mx-auto mb-6">
                <FileText className="w-20 h-20 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-2xl font-bold mb-4">No documents found</h3>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                {searchTerm ? 'Try adjusting your search criteria or filters' : 'Start by uploading your first document to get started'}
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)} size="lg" className="px-8 py-3">
                <Upload className="w-5 h-5 mr-3" />
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Document Mailbox Section */}
        <div className="space-y-8">
          <Separator className="my-16" />
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
                Document Mailbox
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Centralized communication hub for document signatures, approvals, and collaborative workflows. 
                Track progress, manage conversations, and streamline your document processes.
              </p>
            </div>
          </div>
          <DocumentMailbox />
        </div>
      </div>
    </div>
  )
}