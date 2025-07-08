import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Mic, 
  Video, 
  Phone, 
  Search, 
  MoreVertical,
  Image as ImageIcon,
  File,
  Smile,
  Info,
  UserPlus,
  Settings,
  Archive,
  Trash2
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'

interface ChatUser {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'offline' | 'busy'
  lastSeen: string
  unreadCount: number
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  type: 'text' | 'image' | 'file' | 'voice'
  timestamp: string
  fileName?: string
  fileSize?: string
}

const mockUsers: ChatUser[] = [
  {
    id: '1',
    name: 'John Smith',
    status: 'online',
    lastSeen: 'now',
    unreadCount: 3,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Sarah Connor',
    status: 'online',
    lastSeen: '2 min ago',
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    status: 'busy',
    lastSeen: '1 hour ago',
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'Emily Davis',
    status: 'offline',
    lastSeen: '3 hours ago',
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    senderName: 'John Smith',
    content: 'Hey! How is the project coming along?',
    type: 'text',
    timestamp: '10:30 AM'
  },
  {
    id: '2',
    senderId: 'me',
    senderName: 'You',
    content: 'Great! We are almost done with the first phase.',
    type: 'text',
    timestamp: '10:32 AM'
  },
  {
    id: '3',
    senderId: '1',
    senderName: 'John Smith',
    content: 'project-mockup.jpg',
    type: 'image',
    timestamp: '10:35 AM',
    fileName: 'project-mockup.jpg',
    fileSize: '2.4 MB'
  },
  {
    id: '4',
    senderId: 'me',
    senderName: 'You',
    content: 'Looks amazing! The design is exactly what we needed.',
    type: 'text',
    timestamp: '10:37 AM'
  }
]

export default function Chat() {
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [messages, setMessages] = useState<Message[]>(mockMessages)

  // Filter users based on current user's role and linked employee
  const getAvailableUsers = () => {
    if (currentUser?.role === 'Guest' && currentUser.linkedEmployee) {
      // Guest users can only chat with their linked employee
      return mockUsers.filter(user => user.name === currentUser.linkedEmployee)
    }
    // Admin and HR can chat with everyone
    return mockUsers
  }

  const availableUsers = getAvailableUsers()
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Auto-select the first available user for guests
  React.useEffect(() => {
    if (currentUser?.role === 'Guest' && availableUsers.length > 0 && !selectedUser) {
      setSelectedUser(availableUsers[0])
    } else if (currentUser?.role !== 'Guest' && !selectedUser && availableUsers.length > 0) {
      setSelectedUser(availableUsers[0])
    }
  }, [currentUser, availableUsers, selectedUser])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const handleSendMessage = () => {
    if (message.trim() && selectedUser) {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: 'You',
        content: message,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages([...messages, newMessage])
      setMessage('')
    }
  }

  const handleFileUpload = (type: 'image' | 'file') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'image' ? 'image/*' : '*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && selectedUser) {
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: 'me',
          senderName: 'You',
          content: file.name,
          type: type,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`
        }
        setMessages([...messages, newMessage])
        toast({
          title: "File Uploaded",
          description: `${file.name} has been shared in the chat.`,
        })
      }
    }
    input.click()
  }

  const handleVoiceCall = () => {
    toast({
      title: "Voice Call",
      description: `Initiating voice call with ${selectedUser?.name}...`,
    })
  }

  const handleVideoCall = () => {
    toast({
      title: "Video Call",
      description: `Starting video call with ${selectedUser?.name}...`,
    })
  }

  const handleUserAction = (action: string) => {
    switch (action) {
      case 'User Info':
        setIsUserInfoOpen(true)
        break
      case 'Add to Group':
        setIsGroupDialogOpen(true)
        break
      case 'Chat Settings':
        setIsChatSettingsOpen(true)
        break
      case 'Archive Chat':
        handleArchiveChat()
        break
      case 'Delete Chat':
        handleDeleteChat()
        break
      default:
        toast({
          title: action,
          description: `${action} action performed for ${selectedUser?.name}.`,
        })
    }
  }

  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false)

  const handleArchiveChat = () => {
    toast({
      title: "Chat Archived",
      description: `Chat with ${selectedUser?.name} has been archived.`,
    })
  }

  const handleDeleteChat = () => {
    toast({
      title: "Chat Deleted", 
      description: `Chat with ${selectedUser?.name} has been deleted.`,
      variant: "destructive"
    })
  }

  const handleEmojiSelect = () => {
    setMessage(prev => prev + "😊")
    toast({
      title: "Emoji Added",
      description: "Emoji has been added to your message.",
    })
  }

  const handleVoiceRecord = () => {
    toast({
      title: "Voice Recording",
      description: "Voice recording feature activated.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communication Hub</h1>
        <p className="text-muted-foreground">
          Integrated messaging, voice calls, video calls, and file sharing
        </p>
      </div>

      <div className="flex h-[calc(100vh-12rem)] space-x-4">
        {/* Chat List */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? 'bg-accent' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{user.name}</p>
                        {user.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {user.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.status === 'online' ? 'Online' : `Last seen ${user.lastSeen}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        {selectedUser ? (
          <Card className="flex-1 flex flex-col">
            {/* Chat Header */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>
                        {selectedUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(selectedUser.status)}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.status === 'online' ? 'Online' : `Last seen ${selectedUser.lastSeen}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleVoiceCall}>
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleVideoCall}>
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleUserAction('User Info')}>
                    <Info className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUserAction('Add to Group')}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add to Group
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUserAction('Chat Settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Chat Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleUserAction('Archive Chat')}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUserAction('Delete Chat')} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderId === 'me'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-accent'
                        }`}
                      >
                        {msg.type === 'text' && <p>{msg.content}</p>}
                        {msg.type === 'image' && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-sm">{msg.fileName}</span>
                            </div>
                            <div className="w-48 h-32 bg-muted rounded border flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        {msg.type === 'file' && (
                          <div className="flex items-center space-x-2">
                            <File className="w-4 h-4" />
                            <div>
                              <p className="text-sm">{msg.fileName}</p>
                              <p className="text-xs opacity-70">{msg.fileSize}</p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleFileUpload('file')}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleFileUpload('image')}>
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={handleEmojiSelect}>
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleVoiceRecord}>
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a contact to start messaging</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* User Info Dialog */}
      {selectedUser && (
        <Dialog open={isUserInfoOpen} onOpenChange={setIsUserInfoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Information</DialogTitle>
              <DialogDescription>View detailed user information and status</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.status}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p><strong>Status:</strong> {selectedUser.status}</p>
                <p><strong>Last Seen:</strong> {selectedUser.lastSeen}</p>
                <p><strong>Unread Messages:</strong> {selectedUser.unreadCount}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Select a group to add {selectedUser?.name} to:</p>
            <div className="space-y-2">
              {['HR Team', 'Project Alpha', 'Management'].map((group) => (
                <Button key={group} variant="outline" className="w-full justify-start">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {group}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Settings Dialog */}
      <Dialog open={isChatSettingsOpen} onOpenChange={setIsChatSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label>Notifications</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <label>Sound</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <label>Show Read Receipts</label>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}