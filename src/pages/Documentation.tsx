import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit,
  Plus,
  Download,
  Inbox,
  Archive,
  Reply,
  Forward,
  BookOpen
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

const Documentation = () => {
  const [searchTerm, setSearchTerm] = useState("")

  const documents = [
    {
      title: "Employee Handbook",
      description: "Complete guide for all employees including policies, procedures, and company culture.",
      category: "HR Policies",
      lastUpdated: "2024-01-15",
      size: "2.3 MB",
      downloads: 156
    },
    {
      title: "Code of Conduct",
      description: "Guidelines for professional behavior and ethical standards.",
      category: "Compliance",
      lastUpdated: "2024-01-10",
      size: "890 KB",
      downloads: 203
    },
    {
      title: "Remote Work Guidelines",
      description: "Best practices and requirements for remote work arrangements.",
      category: "HR Policies",
      lastUpdated: "2024-01-08",
      size: "1.1 MB",
      downloads: 89
    },
    {
      title: "Performance Review Process",
      description: "Step-by-step guide for conducting employee performance reviews.",
      category: "HR Procedures",
      lastUpdated: "2023-12-20",
      size: "750 KB",
      downloads: 67
    },
    {
      title: "Benefits Overview",
      description: "Comprehensive overview of employee benefits and enrollment processes.",
      category: "Benefits",
      lastUpdated: "2024-01-01",
      size: "1.8 MB",
      downloads: 234
    },
    {
      title: "Security Protocols",
      description: "IT security guidelines and data protection policies.",
      category: "Security",
      lastUpdated: "2023-12-15",
      size: "980 KB",
      downloads: 45
    }
  ]

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = ["All", "HR Policies", "HR Procedures", "Benefits", "Compliance", "Security"]
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categoryFilteredDocuments = selectedCategory === "All" 
    ? filteredDocuments 
    : filteredDocuments.filter(doc => doc.category === selectedCategory)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Access company policies, procedures, and important documents.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Document Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categoryFilteredDocuments.map((doc, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {doc.category}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {doc.description}
              </CardDescription>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Updated: {doc.lastUpdated}</span>
                <span>{doc.size}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {doc.downloads} downloads
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.reduce((sum, doc) => sum + doc.downloads, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Mailbox Section */}
      <div>
        <Separator className="my-8" />
        <h2 className="text-2xl font-bold tracking-tight mb-4">Document Mailbox</h2>
        <p className="text-muted-foreground mb-6">
          Manage document signatures, approvals, and communications.
        </p>
        <DocumentMailbox />
      </div>
    </div>
  )
}

export default Documentation