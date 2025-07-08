import { useState, useMemo } from "react"
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
  Star,
  Reply,
  Forward
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

interface Document {
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
  },
  {
    id: '4',
    title: 'Performance Review Form',
    type: 'other',
    status: 'not_signed',
    sender: 'Manager',
    recipient: 'You',
    sentDate: '2024-01-08',
    dueDate: '2024-01-20',
    description: 'Q4 2023 performance evaluation awaiting your input and signature.',
    priority: 'high',
    read: true,
    comments: [
      {
        id: '2',
        author: 'Manager',
        message: 'Looking forward to your self-assessment',
        timestamp: '2024-01-08 14:00'
      }
    ]
  }
]

const DocumentMailbox = () => {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(documents[0])
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

  const selectDocument = (document: Document) => {
    setSelectedDocument(document)
    if (!document.read) {
      markAsRead(document.id)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Document Mailbox</h1>
          
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
                    <h3 className={cn(
                      "font-medium text-sm truncate max-w-[200px]",
                      !document.read && "font-semibold"
                    )}>
                      {document.title}
                    </h3>
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
            <div className="p-6 border-b bg-background">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(selectedDocument.status)}
                    <h1 className="text-2xl font-bold">{selectedDocument.title}</h1>
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                  <p className="text-muted-foreground">{selectedDocument.description}</p>
                </div>
              </div>

              {/* Document Meta */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">FROM</Label>
                  <p className="font-medium">{selectedDocument.sender}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">TO</Label>
                  <p className="font-medium">{selectedDocument.recipient}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">SENT</Label>
                  <p className="font-medium">{selectedDocument.sentDate || 'Draft'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">DUE</Label>
                  <p className="font-medium">{selectedDocument.dueDate || 'No due date'}</p>
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
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Document Preview */}
                <div className="p-6 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Document Content</span>
                  </div>
                  <div className="bg-background p-4 rounded border min-h-[200px]">
                    <p className="text-sm text-muted-foreground">
                      Document content would be displayed here. This could include PDF preview, 
                      formatted text, or other document formats depending on the file type.
                    </p>
                  </div>
                </div>

                {/* Comments Thread */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments & Messages ({selectedDocument.comments.length})
                  </h3>
                  
                  {selectedDocument.comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No comments yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDocument.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback>
                              {comment.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.author}</span>
                              <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm">{comment.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="border-t pt-4">
                    <Label htmlFor="comment" className="text-sm font-medium">Add a comment</Label>
                    <div className="mt-2 flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          id="comment"
                          placeholder="Write your comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button onClick={addComment} disabled={!newComment.trim()} size="sm">
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
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No document selected</h3>
              <p>Choose a document from the sidebar to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentMailbox