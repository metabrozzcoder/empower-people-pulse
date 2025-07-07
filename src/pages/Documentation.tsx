import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Share,
  Scan,
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
  AlertCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

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
}

interface Signer {
  id: string
  name: string
  email: string
  status: 'pending' | 'signed' | 'declined'
  signedDate?: string
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
    description: 'New office layout design'
  }
]

const categories = ['All', 'HR Policies', 'Legal', 'Facilities', 'Training', 'Finance', 'Custom']

export default function Documentation() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending_signature': return 'bg-yellow-100 text-yellow-800'
      case 'signed': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'archived': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSignerStatusIcon = (status: Signer['status']) => {
    switch (status) {
      case 'signed': return CheckCircle
      case 'declined': return XCircle
      default: return AlertCircle
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsProcessing(true)
      setOcrProgress(0)
      
      // Simulate OCR processing
      const interval = setInterval(() => {
        setOcrProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsProcessing(false)
            toast({
              title: "File Processed",
              description: "Document has been uploaded and processed successfully.",
            })
            return 100
          }
          return prev + 10
        })
      }, 200)

      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('word') ? 'word' : 'image',
        category: 'Custom',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: 'Current User',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'draft',
        tags: ['uploaded'],
        description: 'Newly uploaded document'
      }
      
      setDocuments([newDoc, ...documents])
    }
  }

  const handleSendForSignature = (doc: Document) => {
    setSelectedDocument(doc)
    setIsSignatureDialogOpen(true)
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    toast({
      title: "Document Deleted",
      description: "Document has been successfully deleted.",
    })
  }

  const handleOCRScan = (doc: Document) => {
    setIsProcessing(true)
    setOcrProgress(0)
    
    const interval = setInterval(() => {
      setOcrProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          toast({
            title: "OCR Complete",
            description: "Text extraction completed successfully.",
          })
          return 100
        }
        return prev + 15
      })
    }, 300)
  }

  const totalDocuments = documents.length
  const pendingSignatures = documents.filter(doc => doc.status === 'pending_signature').length
  const signedDocuments = documents.filter(doc => doc.status === 'signed').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground">Manage documents, OCR processing, and electronic signatures</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
          />
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <PenTool className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingSignatures}</p>
                <p className="text-sm text-muted-foreground">Pending Signatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{signedDocuments}</p>
                <p className="text-sm text-muted-foreground">Signed Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Scan className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">OCR Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Document...</span>
                <span>{ocrProgress}%</span>
              </div>
              <Progress value={ocrProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
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

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => {
          const FileIcon = getFileIcon(doc.type)
          return (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{doc.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{doc.category}</Badge>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {doc.description && (
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{doc.uploadedBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Size: {doc.size}
                  </div>
                </div>

                {doc.signers && doc.signers.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Signers ({doc.signers.length})</div>
                    <div className="space-y-1">
                      {doc.signers.slice(0, 2).map((signer) => {
                        const StatusIcon = getSignerStatusIcon(signer.status)
                        return (
                          <div key={signer.id} className="flex items-center space-x-2 text-sm">
                            <StatusIcon className="w-4 h-4" />
                            <span>{signer.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {signer.status}
                            </Badge>
                          </div>
                        )
                      })}
                      {doc.signers.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{doc.signers.length - 2} more signers
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOCRScan(doc)}>
                    <Scan className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSendForSignature(doc)}>
                    <PenTool className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="scan">OCR Scan</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input type="file" id="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== 'All').map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Enter document description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" placeholder="tag1, tag2, tag3" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="scan" className="space-y-4">
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Scan className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">OCR Document Scanning</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an image or PDF to extract text using OCR technology
                  </p>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Select Image/PDF
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsUploadDialogOpen(false)}>
              Upload Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send for Electronic Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document</Label>
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="font-medium">{selectedDocument?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDocument?.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Add Signers</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input placeholder="Signer name" className="flex-1" />
                  <Input placeholder="Email address" className="flex-1" />
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message to Signers</Label>
              <Textarea 
                id="message" 
                placeholder="Please review and sign this document..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Signing Order</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select signing order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parallel">All signers can sign simultaneously</SelectItem>
                  <SelectItem value="sequential">Signers must sign in order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSignatureDialogOpen(false)}>
              <PenTool className="w-4 h-4 mr-2" />
              Send for Signature
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}