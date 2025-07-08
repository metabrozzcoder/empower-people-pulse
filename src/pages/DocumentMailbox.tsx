import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit,
  Plus,
  Download
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
    description: 'Standard employment contract for new hire',
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
    description: 'Standard NDA for all employees',
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
    description: 'Updated remote work guidelines',
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
    description: 'Q4 2023 performance evaluation',
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
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [newComment, setNewComment] = useState("")

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [documents, searchTerm, statusFilter])

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
      <Badge variant={variants[status as keyof typeof variants]}>
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
    
    toast({
      title: "Document Signed",
      description: "The document has been successfully signed.",
    })
  }

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusIcon(document.status)}
              {document.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {document.description}
            </CardDescription>
          </div>
          {getStatusBadge(document.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>From: {document.sender}</span>
            <span>To: {document.recipient}</span>
            {document.sentDate && <span>Sent: {document.sentDate}</span>}
          </div>
          <div className="flex items-center gap-2">
            {document.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{document.comments.length}</span>
              </div>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDocument(document)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Mailbox</h1>
        <p className="text-muted-foreground">
          Manage your documents, signatures, and communications.
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="not_signed">Not Signed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {filteredDocuments
            .filter(doc => doc.sender === 'You' || doc.sender.includes('Department'))
            .map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {filteredDocuments
            .filter(doc => doc.recipient === 'You')
            .map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {filteredDocuments
            .filter(doc => doc.status === 'draft')
            .map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedDocument.status)}
                {selectedDocument.title}
              </DialogTitle>
              <DialogDescription>
                {selectedDocument.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="mt-1 capitalize">{selectedDocument.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">From</Label>
                  <p className="mt-1">{selectedDocument.sender}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">To</Label>
                  <p className="mt-1">{selectedDocument.recipient}</p>
                </div>
                {selectedDocument.sentDate && (
                  <div>
                    <Label className="text-sm font-medium">Sent Date</Label>
                    <p className="mt-1">{selectedDocument.sentDate}</p>
                  </div>
                )}
                {selectedDocument.dueDate && (
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <p className="mt-1">{selectedDocument.dueDate}</p>
                  </div>
                )}
              </div>

              {/* Document Actions */}
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {selectedDocument.status === 'pending' && (
                  <Button onClick={() => signDocument(selectedDocument.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign Document
                  </Button>
                )}
                <Button variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Forward
                </Button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Comments & Messages</h3>
                
                {selectedDocument.comments.length === 0 ? (
                  <p className="text-muted-foreground">No comments yet.</p>
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.author}</span>
                            <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <p className="mt-1">{comment.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="space-y-3">
                  <Label htmlFor="comment">Add Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Write your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DocumentMailbox