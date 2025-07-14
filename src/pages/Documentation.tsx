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
import { 
  Inbox, 
  Send, 
  File, 
  Archive, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  Clock, 
  Star,
  Paperclip,
  Forward,
  Reply,
  MoreHorizontal,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DocumentMessage {
  id: string
  subject: string
  content: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  status: 'Draft' | 'Sent' | 'Pending' | 'Approved' | 'Declined' | 'Archived'
  createdAt: string
  updatedAt: string
  attachments?: {
    id: string
    name: string
    size: string
    type: string
    url?: string
  }[]
  isRead: boolean
  isStarred: boolean
  category: string
  labels: string[]
}

const mockMessages: DocumentMessage[] = [
  {
    id: '1',
    subject: 'Employee Handbook Update - Review Required',
    content: 'Please review the updated employee handbook sections regarding remote work policies and provide your feedback by end of week.',
    from: 'HR Department',
    to: ['All Managers'],
    priority: 'High',
    status: 'Sent',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    attachments: [
      { id: 'att1', name: 'Employee_Handbook_v2.4.pdf', size: '2.4 MB', type: 'pdf' }
    ],
    isRead: false,
    isStarred: true,
    category: 'HR Policies',
    labels: ['urgent', 'review-required']
  },
  {
    id: '2',
    subject: 'Quarterly Budget Report - Q1 2024',
    content: 'The Q1 budget report is ready for review. Please find the detailed breakdown attached. Finance team meeting scheduled for discussion.',
    from: 'Finance Team',
    to: ['Department Heads'],
    priority: 'Normal',
    status: 'Pending',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T14:20:00Z',
    attachments: [
      { id: 'att2', name: 'Q1_Budget_Report.xlsx', size: '1.8 MB', type: 'xlsx' }
    ],
    isRead: true,
    isStarred: false,
    category: 'Finance',
    labels: ['budget', 'quarterly']
  },
  {
    id: '3',
    subject: 'New Equipment Request Form',
    content: 'Submitting request for new video editing equipment for the production team. Approval needed for budget allocation.',
    from: 'Production Team',
    to: ['IT Manager', 'Finance Manager'],
    priority: 'Normal',
    status: 'Draft',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T16:45:00Z',
    attachments: [
      { id: 'att3', name: 'Equipment_Specs.docx', size: '856 KB', type: 'docx' }
    ],
    isRead: true,
    isStarred: false,
    category: 'Equipment',
    labels: ['request', 'approval-needed']
  }
]

const folders = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, count: 12 },
  { id: 'sent', name: 'Sent', icon: Send, count: 8 },
  { id: 'drafts', name: 'Drafts', icon: File, count: 3 },
  { id: 'archived', name: 'Archived', icon: Archive, count: 24 },
  { id: 'starred', name: 'Starred', icon: Star, count: 5 }
]

const priorities = ['All', 'Low', 'Normal', 'High', 'Urgent']
const categories = ['All', 'HR Policies', 'Finance', 'Equipment', 'Technical', 'Marketing']

export default function Documentation() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<DocumentMessage[]>(mockMessages)
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [selectedMessage, setSelectedMessage] = useState<DocumentMessage | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  
  // Form states
  const [composeForm, setComposeForm] = useState({
    to: '',
    cc: '',
    subject: '',
    content: '',
    priority: 'Normal' as DocumentMessage['priority'],
    category: 'HR Policies'
  })

  const filteredMessages = messages.filter(msg => {
    const matchesFolder = 
      selectedFolder === 'inbox' && msg.status === 'Sent' ||
      selectedFolder === 'sent' && msg.status === 'Sent' ||
      selectedFolder === 'drafts' && msg.status === 'Draft' ||
      selectedFolder === 'archived' && msg.status === 'Archived' ||
      selectedFolder === 'starred' && msg.isStarred

    const matchesSearch = 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.from.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriority = selectedPriority === 'All' || msg.priority === selectedPriority
    const matchesCategory = selectedCategory === 'All' || msg.category === selectedCategory

    return matchesFolder && matchesSearch && matchesPriority && matchesCategory
  })

  const getPriorityColor = (priority: DocumentMessage['priority']) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: DocumentMessage['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Sent': return 'bg-blue-100 text-blue-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Declined': return 'bg-red-100 text-red-800'
      case 'Archived': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleMessageClick = (message: DocumentMessage) => {
    setSelectedMessage(message)
    if (!message.isRead) {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, isRead: true } : m
      ))
    }
    setIsViewDialogOpen(true)
  }

  const handleStarToggle = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
    ))
    toast({
      title: "Message Updated",
      description: "Message starred status updated."
    })
  }

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
    toast({
      title: "Message Deleted",
      description: "Message has been moved to trash."
    })
  }

  const handleArchiveMessage = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, status: 'Archived' } : m
    ))
    toast({
      title: "Message Archived",
      description: "Message has been archived."
    })
  }

  const handleCompose = () => {
    setComposeForm({
      to: '',
      cc: '',
      subject: '',
      content: '',
      priority: 'Normal',
      category: 'HR Policies'
    })
    setIsComposeDialogOpen(true)
  }

  const handleReply = (message: DocumentMessage) => {
    setSelectedMessage(message)
    setComposeForm({
      to: message.from,
      cc: '',
      subject: `Re: ${message.subject}`,
      content: `\n\n--- Original Message ---\nFrom: ${message.from}\nSubject: ${message.subject}\n\n${message.content}`,
      priority: 'Normal',
      category: message.category
    })
    setIsReplyDialogOpen(true)
  }

  const handleSendMessage = () => {
    const newMessage: DocumentMessage = {
      id: Date.now().toString(),
      subject: composeForm.subject,
      content: composeForm.content,
      from: 'Current User',
      to: composeForm.to.split(',').map(email => email.trim()),
      cc: composeForm.cc ? composeForm.cc.split(',').map(email => email.trim()) : undefined,
      priority: composeForm.priority,
      status: 'Sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      category: composeForm.category,
      labels: []
    }

    setMessages(prev => [newMessage, ...prev])
    setIsComposeDialogOpen(false)
    setIsReplyDialogOpen(false)
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully."
    })
  }

  const handleRefresh = () => {
    toast({
      title: "Refreshing...",
      description: "Checking for new messages."
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Center</h1>
        <p className="text-muted-foreground">
          Manage documents, communications, and file sharing like an email system
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-4">
          <Card>
            <CardContent className="p-4">
              <Button 
                onClick={handleCompose}
                className="w-full mb-4" 
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Compose
              </Button>

              <div className="space-y-1">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
                      selectedFolder === folder.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <div className="flex items-center">
                      <folder.icon className="mr-2 h-4 w-4" />
                      <span className="text-sm font-medium">{folder.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {folder.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Filters */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Toolbar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                        !message.isRead ? 'bg-blue-50/30' : ''
                      }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {message.from.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`font-medium text-sm ${!message.isRead ? 'font-bold' : ''}`}>
                                {message.from}
                              </span>
                              <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                                {message.priority}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                                {message.status}
                              </Badge>
                            </div>
                            
                            <div className={`text-sm ${!message.isRead ? 'font-semibold' : 'text-muted-foreground'} mb-1`}>
                              {message.subject}
                            </div>
                            
                            <div className="text-xs text-muted-foreground truncate">
                              {message.content}
                            </div>
                            
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="flex items-center mt-2">
                                <Paperclip className="w-3 h-3 mr-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStarToggle(message.id)
                            }}
                          >
                            <Star className={`w-4 h-4 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleReply(message)}>
                                <Reply className="mr-2 h-4 w-4" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Forward className="mr-2 h-4 w-4" />
                                Forward
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchiveMessage(message.id)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <div className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No messages found</h3>
                    <p className="text-muted-foreground">
                      {selectedFolder === 'inbox' 
                        ? "You're all caught up! No new messages in your inbox."
                        : `No messages in ${folders.find(f => f.id === selectedFolder)?.name?.toLowerCase()}.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedMessage.subject}</DialogTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getPriorityColor(selectedMessage.priority)}>
                        {selectedMessage.priority}
                      </Badge>
                      <Badge className={getStatusColor(selectedMessage.status)}>
                        {selectedMessage.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleReply(selectedMessage)}>
                      <Reply className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Forward className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleStarToggle(selectedMessage.id)}>
                      <Star className={`w-4 h-4 ${selectedMessage.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Message Header */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">From:</span>
                    <span>{selectedMessage.from}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">To:</span>
                    <span>{selectedMessage.to.join(', ')}</span>
                  </div>
                  {selectedMessage.cc && selectedMessage.cc.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">CC:</span>
                      <span>{selectedMessage.cc.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedMessage.content}
                  </div>
                </div>

                {/* Attachments */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Attachments ({selectedMessage.attachments.length})</h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-blue-500" />
                            <div>
                              <p className="font-medium text-sm">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">{attachment.size}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Compose Message Dialog */}
      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compose New Message</DialogTitle>
            <DialogDescription>
              Create a new document communication
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  placeholder="Enter recipient email addresses"
                  value={composeForm.to}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc">CC (Optional)</Label>
                <Input
                  id="cc"
                  placeholder="Enter CC email addresses"
                  value={composeForm.cc}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, cc: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter message subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={composeForm.priority} 
                  onValueChange={(value) => setComposeForm(prev => ({ ...prev, priority: value as DocumentMessage['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={composeForm.category} 
                  onValueChange={(value) => setComposeForm(prev => ({ ...prev, category: value }))}
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
            
            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                placeholder="Enter your message content..."
                rows={10}
                value={composeForm.content}
                onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline">
              <Paperclip className="w-4 h-4 mr-2" />
              Attach Files
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsComposeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              Reply to: {selectedMessage?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reply-to">To</Label>
                <Input
                  id="reply-to"
                  value={composeForm.to}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply-cc">CC (Optional)</Label>
                <Input
                  id="reply-cc"
                  placeholder="Enter CC email addresses"
                  value={composeForm.cc}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, cc: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reply-subject">Subject</Label>
              <Input
                id="reply-subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reply-content">Message</Label>
              <Textarea
                id="reply-content"
                rows={12}
                value={composeForm.content}
                onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline">
              <Paperclip className="w-4 h-4 mr-2" />
              Attach Files
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}