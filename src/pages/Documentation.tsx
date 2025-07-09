import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  BookOpen,
  Video,
  HelpCircle,
  Star,
  Eye,
  Clock,
  User
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Document {
  id: string
  title: string
  content: string
  category: string
  type: 'guide' | 'policy' | 'procedure' | 'faq' | 'video'
  author: string
  createdDate: string
  updatedDate: string
  views: number
  rating: number
  tags: string[]
  status: 'draft' | 'published' | 'archived'
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Employee Onboarding Guide',
    content: 'Complete guide for new employee onboarding process including paperwork, orientation, and first-week activities.',
    category: 'HR Procedures',
    type: 'guide',
    author: 'Sarah Wilson',
    createdDate: '2024-01-15',
    updatedDate: '2024-01-20',
    views: 245,
    rating: 4.8,
    tags: ['onboarding', 'new-hire', 'orientation'],
    status: 'published'
  },
  {
    id: '2',
    title: 'Remote Work Policy',
    content: 'Guidelines and policies for remote work arrangements, including equipment, communication protocols, and performance expectations.',
    category: 'Company Policies',
    type: 'policy',
    author: 'John Smith',
    createdDate: '2024-01-10',
    updatedDate: '2024-01-18',
    views: 189,
    rating: 4.5,
    tags: ['remote-work', 'policy', 'guidelines'],
    status: 'published'
  },
  {
    id: '3',
    title: 'Performance Review Process',
    content: 'Step-by-step procedure for conducting annual and quarterly performance reviews.',
    category: 'HR Procedures',
    type: 'procedure',
    author: 'Emily Davis',
    createdDate: '2024-01-05',
    updatedDate: '2024-01-12',
    views: 156,
    rating: 4.6,
    tags: ['performance', 'review', 'evaluation'],
    status: 'published'
  },
  {
    id: '4',
    title: 'How to Use the HRM System',
    content: 'Video tutorial showing how to navigate and use the HRM system effectively.',
    category: 'Training',
    type: 'video',
    author: 'Mike Johnson',
    createdDate: '2024-01-08',
    updatedDate: '2024-01-15',
    views: 312,
    rating: 4.9,
    tags: ['training', 'system', 'tutorial'],
    status: 'published'
  },
  {
    id: '5',
    title: 'Frequently Asked Questions',
    content: 'Common questions and answers about HR policies, benefits, and procedures.',
    category: 'Support',
    type: 'faq',
    author: 'Lisa Thompson',
    createdDate: '2024-01-12',
    updatedDate: '2024-01-22',
    views: 423,
    rating: 4.7,
    tags: ['faq', 'support', 'help'],
    status: 'published'
  }
]

export default function Documentation() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const categories = Array.from(new Set(documents.map(doc => doc.category)))
  const types = Array.from(new Set(documents.map(doc => doc.type)))

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesType = selectedType === 'all' || doc.type === selectedType
    return matchesSearch && matchesCategory && matchesType && doc.status === 'published'
  })

  const getTypeIcon = (type: Document['type']) => {
    switch (type) {
      case 'guide': return BookOpen
      case 'policy': return FileText
      case 'procedure': return FileText
      case 'faq': return HelpCircle
      case 'video': return Video
      default: return FileText
    }
  }

  const getTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'guide': return 'bg-blue-100 text-blue-800'
      case 'policy': return 'bg-red-100 text-red-800'
      case 'procedure': return 'bg-green-100 text-green-800'
      case 'faq': return 'bg-yellow-100 text-yellow-800'
      case 'video': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAddDocument = () => {
    setSelectedDoc(null)
    setIsDialogOpen(true)
  }

  const handleEditDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setIsDialogOpen(true)
  }

  const handleViewDocument = (doc: Document) => {
    // Increment view count
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, views: d.views + 1 } : d
    ))
    setSelectedDoc(doc)
    setIsViewDialogOpen(true)
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
    toast({
      title: "Document Deleted",
      description: "Document has been successfully deleted.",
    })
  }

  const handleSaveDocument = () => {
    if (selectedDoc && selectedDoc.id && selectedDoc.id !== 'new') {
      // Update existing document
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDoc.id ? { ...selectedDoc, updatedDate: new Date().toISOString().split('T')[0] } : doc
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
        content: "Document content goes here...",
        category: "General",
        type: 'guide',
        author: "Current User",
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
        views: 0,
        rating: 0,
        tags: ['new'],
        status: 'published'
      }
      setDocuments(prev => [...prev, newDoc])
      toast({
        title: "Document Created",
        description: "New document has been successfully created.",
      })
    }
    setIsDialogOpen(false)
  }

  const handleDownload = (doc: Document) => {
    // Create a blob with the document content
    const content = `${doc.title}\n\n${doc.content}\n\nAuthor: ${doc.author}\nCreated: ${doc.createdDate}\nTags: ${doc.tags.join(', ')}`
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
  }

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.md,.pdf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          const newDoc: Document = {
            id: Date.now().toString(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            content: content,
            category: "Uploaded",
            type: 'guide',
            author: "Current User",
            createdDate: new Date().toISOString().split('T')[0],
            updatedDate: new Date().toISOString().split('T')[0],
            views: 0,
            rating: 0,
            tags: ['uploaded'],
            status: 'published'
          }
          setDocuments(prev => [...prev, newDoc])
          toast({
            title: "Document Uploaded",
            description: `${file.name} has been uploaded successfully.`,
          })
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleRating = (docId: string, rating: number) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, rating } : doc
    ))
    toast({
      title: "Rating Submitted",
      description: "Thank you for your feedback!",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground">Access guides, policies, and training materials</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button onClick={handleAddDocument}>
            <Plus className="w-4 h-4 mr-2" />
            Add Document
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
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{documents.reduce((sum, doc) => sum + doc.views, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{(documents.reduce((sum, doc) => sum + doc.rating, 0) / documents.length).toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Documents</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
          <TabsTrigger value="popular">Most Popular</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const TypeIcon = getTypeIcon(doc.type)
              return (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDocument(doc)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{doc.title}</CardTitle>
                          <Badge className={getTypeColor(doc.type)} variant="outline">
                            {doc.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(doc)
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditDocument(doc)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDocument(doc.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">{doc.content}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3" />
                        <span>{doc.author}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-3 h-3" />
                        <span>{doc.views} views</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 cursor-pointer ${
                              star <= doc.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRating(doc.id, star)
                            }}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">({doc.rating})</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{doc.updatedDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6">
            {categories.map((category) => {
              const categoryDocs = documents.filter(doc => doc.category === category && doc.status === 'published')
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                    <CardDescription>{categoryDocs.length} documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryDocs.slice(0, 4).map((doc) => {
                        const TypeIcon = getTypeIcon(doc.type)
                        return (
                          <div key={doc.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer" onClick={() => handleViewDocument(doc)}>
                            <TypeIcon className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <h4 className="font-medium">{doc.title}</h4>
                              <p className="text-sm text-muted-foreground">{doc.views} views • {doc.rating} rating</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents
              .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
              .slice(0, 9)
              .map((doc) => {
                const TypeIcon = getTypeIcon(doc.type)
                return (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDocument(doc)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <TypeIcon className="w-8 h-8 text-primary" />
                        <div className="flex-1">
                          <h3 className="font-medium line-clamp-2">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground">Added {doc.createdDate}</p>
                          <Badge className={getTypeColor(doc.type)} variant="outline" size="sm">
                            {doc.type}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents
              .sort((a, b) => b.views - a.views)
              .slice(0, 9)
              .map((doc) => {
                const TypeIcon = getTypeIcon(doc.type)
                return (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDocument(doc)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <TypeIcon className="w-8 h-8 text-primary" />
                        <div className="flex-1">
                          <h3 className="font-medium line-clamp-2">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground">{doc.views} views • {doc.rating} rating</p>
                          <Badge className={getTypeColor(doc.type)} variant="outline" size="sm">
                            {doc.type}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Document Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDoc ? 'Edit Document' : 'Add New Document'}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc ? 'Update document information' : 'Create a new document'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter document title" defaultValue={selectedDoc?.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select defaultValue={selectedDoc?.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR Procedures">HR Procedures</SelectItem>
                  <SelectItem value="Company Policies">Company Policies</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select defaultValue={selectedDoc?.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" placeholder="tag1, tag2, tag3" defaultValue={selectedDoc?.tags.join(', ')} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" placeholder="Enter document content" rows={8} defaultValue={selectedDoc?.content} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDocument}>
              {selectedDoc ? 'Update' : 'Create'} Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedDoc && (
                <>
                  {React.createElement(getTypeIcon(selectedDoc.type), { className: "w-5 h-5" })}
                  <span>{selectedDoc.title}</span>
                  <Badge className={getTypeColor(selectedDoc.type)} variant="outline">
                    {selectedDoc.type}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc && (
                <div className="flex items-center space-x-4 text-sm">
                  <span>By {selectedDoc.author}</span>
                  <span>•</span>
                  <span>{selectedDoc.views} views</span>
                  <span>•</span>
                  <span>Updated {selectedDoc.updatedDate}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{selectedDoc.rating}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedDoc.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedDoc.content}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rate this document:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 cursor-pointer ${
                        star <= selectedDoc.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                      onClick={() => handleRating(selectedDoc.id, star)}
                    />
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleDownload(selectedDoc)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEditDocument(selectedDoc)
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}