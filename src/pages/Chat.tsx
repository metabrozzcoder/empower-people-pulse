
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
  Smile
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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
    unreadCount: 3
  },
  {
    id: '2',
    name: 'Sarah Connor',
    status: 'online',
    lastSeen: '2 min ago',
    unreadCount: 0
  },
  {
    id: '3',
    name: 'Mike Johnson',
    status: 'busy',
    lastSeen: '1 hour ago',
    unreadCount: 1
  },
  {
    id: '4',
    name: 'Emily Davis',
    status: 'offline',
    lastSeen: '3 hours ago',
    unreadCount: 0
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
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(mockUsers[0])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('')
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] space-x-4">
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
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-16rem)] p-4">
              <div className="space-y-4">
                {mockMessages.map((msg) => (
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
                          <div className="w-48 h-32 bg-muted rounded border" />
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
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
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
                  <Button variant="ghost" size="sm">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={handleSendMessage}>
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
  )
}
