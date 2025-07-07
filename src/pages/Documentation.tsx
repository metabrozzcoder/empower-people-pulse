import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
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
  AlertCircle,
  Send,
  X,
  Users,
  FileSearch
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
  extractedText?: string
  recipients?: string[]
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

const categories = ['All', 'HR Policies', 'Legal', 'Facilities', 'Training', 'Finance', 'Custom']

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
  const [uploadFormData, setUploadFormData] = useState({
    category: '',
    description: '',
    tags: '',
    recipients: ''
  })
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

  const simulateOCR = (fileName: string): Promise<string> => {
    return new Promise((resolve) => {
      const sampleTexts = {
        'contract': 'Employment Contract\n\nThis agreement is entered into between [Company Name] and [Employee Name].\n\nTerms and Conditions:\n1. Position: [Job Title]\n2. Start Date: [Date]\n3. Salary: [Amount]\n4. Benefits: Health insurance, dental, vision\n5. Vacation: 15 days annually\n\nEmployee Responsibilities:\n- Perform duties as assigned\n- Maintain confidentiality\n- Follow company policies\n\nTermination clause included.',
        'handbook': 'Employee Handbook 2024\n\nTable of Contents:\n1. Company Overview\n2. Employment Policies\n3. Benefits and Compensation\n4. Code of Conduct\n5. Safety Guidelines\n6. IT and Security Policies\n\nCompany Mission:\nTo provide excellent service while maintaining a positive work environment.\n\nCore Values:\n- Integrity\n- Teamwork\n- Innovation\n- Customer Focus',
        'invoice': 'INVOICE #INV-2024-001\n\nBill To:\n[Client Name]\n[Address]\n\nServices Provided:\nConsulting Services - January 2024\nHours: 40\nRate: $100/hour\nTotal: $4,000.00\n\nPayment Terms: Net 30\nDue Date: February 15, 2024',
        'default': `Document Content Extracted\n\nThis document contains important information that has been successfully extracted using OCR technology.\n\nKey sections identified:\n- Header information\n- Main content body\n- Footer details\n- Date: ${new Date().toLocaleDateString()}\n- Processing completed successfully`
      }
      
      const textKey = fileName.toLowerCase().includes('contract') ? 'contract' :
                     fileName.toLowerCase().includes('handbook') ? 'handbook' :
                     fileName.toLowerCase().includes('invoice') ? 'invoice' : 'default'
      
      setTimeout(() => resolve(sampleTexts[textKey]), 2000)
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsProcessing(true)
      setOcrProgress(0)
      
      // Simulate OCR processing with real progress
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
        const extractedText = await simulateOCR(file.name)
        setOcrProgress(100)
        
        const newDoc: Document = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 
                file.type.includes('word') ? 'word' : 
                file.type.includes('image') ? 'image' : 'text',
          category: uploadFormData.category || 'Custom',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          uploadedBy: 'Current User',
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'draft',
          tags: uploadFormData.tags ? uploadFormData.tags.split(',').map(t => t.trim()) : ['uploaded'],
          description: uploadFormData.description || 'Newly uploaded document',
          extractedText,
          recipients: uploadFormData.recipients ? uploadFormData.recipients.split(',').map(r => r.trim()) : []
        }
        
        setDocuments([newDoc, ...documents])
        setIsProcessing(false)
        
        toast({
          title: "Document Uploaded Successfully",
          description: `${file.name} has been processed and text extracted via OCR.`,
        })
        
        // Reset form
        setUploadFormData({ category: '', description: '', tags: '', recipients: '' })
        
      } catch (error) {
        setIsProcessing(false)
        toast({
          title: "Upload Failed",
          description: "There was an error processing the document.",
        })
      }
    }
  }

  const handleOCRScan = async (doc: Document) => {
    setIsProcessing(true)
    setOcrProgress(0)
    
    const progressInterval = setInterval(() => {
      setOcrProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 20
      })
    }, 200)

    try {
      const extractedText = await simulateOCR(doc.name)
      setOcrProgress(100)
      
      // Update document with extracted text
      setDocuments(documents.map(d => 
        d.id === doc.id ? { ...d, extractedText } : d
      ))
      
      setIsProcessing(false)
      toast({
        title: "OCR Processing Complete",
        description: `Text successfully extracted from ${doc.name}`,
      })
    } catch (error) {
      setIsProcessing(false)
      toast({
        title: "OCR Failed",
        description: "There was an error extracting text from the document.",
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
    setDocuments(documents.map(d => 
      d.id === doc.id 
        ? { ...d, status: 'pending_signature' as Document['status'] }
        : d
    ))
    
    toast({
      title: "Document Sent",
      description: `${doc.name} has been sent for signature.`,
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
              onClick={() => document.getElementById('file-upload')?.click()}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Upload className="w-5 h-5 mr-2" />
              Quick Upload
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
              onChange={handleFileUpload}
            />
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setIsUploadDialogOpen(true)}
              className="border-primary/20 hover:bg-primary/5"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Document
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
                    <Scan className="w-6 h-6 text-primary animate-pulse" />
                    <span className="font-medium">Processing Document with OCR...</span>
                  </div>
                  <span className="text-sm font-medium text-primary">{Math.round(ocrProgress)}%</span>
                </div>
                <Progress value={ocrProgress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Extracting text content and analyzing document structure...
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
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48 h-12">
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
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.type)
            return (
              <Card key={doc.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-background to-muted/5">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        <FileIcon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate">{doc.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                          <Badge className={`text-xs ${getStatusColor(doc.status)}`}>
                            {doc.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {doc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="truncate">{doc.uploadedBy}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Size:</span> {doc.size}
                  </div>

                  {doc.signers && doc.signers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <Users className="w-4 h-4" />
                        <span>Signers ({doc.signers.length})</span>
                      </div>
                      <div className="space-y-1">
                        {doc.signers.slice(0, 2).map((signer) => {
                          const StatusIcon = getSignerStatusIcon(signer.status)
                          return (
                            <div key={signer.id} className="flex items-center space-x-2 text-sm">
                              <StatusIcon className="w-4 h-4" />
                              <span className="truncate">{signer.name}</span>
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
                    {doc.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{doc.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDocument(doc)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    
                    {doc.status === 'draft' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSendDocument(doc)}
                        className="bg-primary/5 hover:bg-primary/10 border-primary/20"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOCRScan(doc)}
                      title="OCR Scan"
                    >
                      <Scan className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditDocument(doc)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadDocument(doc)}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="hover:bg-destructive/10 hover:border-destructive/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredDocuments.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileSearch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground mb-4">
                No documents match your current search criteria.
              </p>
              <Button onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedStatus('all')
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Upload New Document</DialogTitle>
              <DialogDescription>
                Upload and process documents with advanced OCR technology
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-base font-medium">Select File</Label>
                  <Input 
                    type="file" 
                    id="file" 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    onChange={handleFileUpload}
                    className="h-12"
                  />
                  <p className="text-sm text-muted-foreground">
                    Supports PDF, Word documents, images (PNG, JPG), and text files
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base font-medium">Category</Label>
                    <Select value={uploadFormData.category} onValueChange={(value) => 
                      setUploadFormData(prev => ({ ...prev, category: value }))
                    }>
                      <SelectTrigger className="h-12">
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
                    <Label htmlFor="recipients" className="text-base font-medium">Recipients (optional)</Label>
                    <Input 
                      id="recipients" 
                      placeholder="email1@company.com, email2@company.com"
                      value={uploadFormData.recipients}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, recipients: e.target.value }))}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter document description..."
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-base font-medium">Tags</Label>
                  <Input 
                    id="tags" 
                    placeholder="contract, legal, 2024, important"
                    value={uploadFormData.tags}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="h-12"
                  />
                  <p className="text-sm text-muted-foreground">Separate tags with commas</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  document.getElementById('file')?.click()
                  setIsUploadDialogOpen(false)
                }}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload & Process
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedDocument?.name}</DialogTitle>
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(selectedDocument?.status || 'draft')}>
                  {selectedDocument?.status?.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedDocument?.size} • {selectedDocument?.uploadedBy}
                </span>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedDocument?.description && (
                <div>
                  <Label className="text-base font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedDocument.description}</p>
                </div>
              )}

              {selectedDocument?.extractedText && (
                <div>
                  <Label className="text-base font-medium">Extracted Text (OCR)</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{selectedDocument.extractedText}</pre>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedDocument?.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => handleDownloadDocument(selectedDocument!)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Document Name</Label>
                <Input 
                  id="edit-name" 
                  value={selectedDocument?.name || ''}
                  onChange={(e) => {
                    if (selectedDocument) {
                      setSelectedDocument({ ...selectedDocument, name: e.target.value })
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={selectedDocument?.description || ''}
                  onChange={(e) => {
                    if (selectedDocument) {
                      setSelectedDocument({ ...selectedDocument, description: e.target.value })
                    }
                  }}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <Input 
                  id="edit-tags" 
                  value={selectedDocument?.tags.join(', ') || ''}
                  onChange={(e) => {
                    if (selectedDocument) {
                      setSelectedDocument({ 
                        ...selectedDocument, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                      })
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={selectedDocument?.category || ''} 
                  onValueChange={(value) => {
                    if (selectedDocument) {
                      setSelectedDocument({ ...selectedDocument, category: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'All').map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (selectedDocument) {
                  setDocuments(documents.map(d => 
                    d.id === selectedDocument.id ? selectedDocument : d
                  ))
                  setIsEditDialogOpen(false)
                  toast({
                    title: "Document Updated",
                    description: "Document details have been successfully updated.",
                  })
                }
              }}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Signature Dialog */}
        <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Send for Electronic Signature</DialogTitle>
              <DialogDescription>
                Configure document signing workflow and add recipients
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Document</Label>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="font-medium">{selectedDocument?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDocument?.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Signers</Label>
                {newSigners.map((signer, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input 
                      placeholder="Full name"
                      value={signer.name}
                      onChange={(e) => updateSignerField(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input 
                      type="email"
                      placeholder="Email address"
                      value={signer.email}
                      onChange={(e) => updateSignerField(index, 'email', e.target.value)}
                      className="flex-1"
                    />
                    {newSigners.length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeSignerField(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addNewSigner} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Signer
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message to Signers</Label>
                <Textarea 
                  id="message" 
                  placeholder="Please review and sign this document. If you have any questions, feel free to contact me."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Signing Order</Label>
                <Select defaultValue="parallel">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parallel">All signers can sign simultaneously</SelectItem>
                    <SelectItem value="sequential">Signers must sign in order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setIsSignatureDialogOpen(false)
                  toast({
                    title: "Document Sent for Signature",
                    description: "All signers have been notified via email.",
                  })
                }}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Send className="w-4 h-4 mr-2" />
                Send for Signature
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}