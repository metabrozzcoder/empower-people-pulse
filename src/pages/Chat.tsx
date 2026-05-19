import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageSquare, Send, Paperclip, Mic, Video, Phone, Search,
  MoreVertical, Image as ImageIcon, File as FileIcon, Smile, Info,
  UserPlus, Play, Pause, Settings, Archive, Trash2, Reply, Copy,
  Star, Pin, BellOff, Bell, Check, CheckCheck, Download, X,
  CornerUpLeft, PlusCircle, ArchiveRestore, Square, Users, Forward,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { mockEmployees } from '@/data/mockEmployees'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface ChatUser {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'offline' | 'busy'
  lastSeen: string
  unreadCount: number
  role?: string
  isGroup?: boolean
  members?: { id: string; name: string; avatar?: string }[]
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
  dataUrl?: string
  duration?: number
  replyTo?: { id: string; content: string; senderName: string }
  starred?: boolean
  status?: 'sent' | 'delivered' | 'read'
  edited?: boolean
  forwarded?: boolean
  archived?: boolean
}

interface ConvMeta {
  pinned?: boolean
  muted?: boolean
  archived?: boolean
}

const STORAGE_KEY = 'chat:v3'
const META_KEY = 'chat:meta:v3'
const USERS_KEY = 'chat:users:v3'

// Build initial user list from registered employees
const buildInitialUsers = (): ChatUser[] => {
  const statuses: ChatUser['status'][] = ['online', 'offline', 'busy']
  return mockEmployees.map((e, i) => ({
    id: `emp-${e.id}`,
    name: e.name,
    avatar: e.avatar,
    role: e.position,
    status: statuses[i % statuses.length],
    lastSeen: i % 3 === 0 ? 'now' : `${(i + 1) * 5} min ago`,
    unreadCount: i === 0 ? 2 : 0,
  }))
}

const seedMessages = (userId: string): Message[] => [
  { id: `${userId}-1`, senderId: userId, senderName: '', content: 'Hey! How is the project coming along?', type: 'text', timestamp: '10:30 AM', status: 'read' },
  { id: `${userId}-2`, senderId: 'me', senderName: 'You', content: 'Great! We are almost done with the first phase.', type: 'text', timestamp: '10:32 AM', status: 'read' },
  { id: `${userId}-3`, senderId: 'me', senderName: 'You', content: 'Looks amazing! The design is exactly what we needed.', type: 'text', timestamp: '10:37 AM', status: 'delivered' },
]

const EMOJIS = ['😊','😂','❤️','👍','🎉','🔥','🙏','👏','😍','🤔','😎','💯','✅','🚀','💡','😢','😅','🙌','👀','🤝']

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function Chat() {
  const { toast } = useToast()
  const { currentUser } = useAuth()

  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [draft, setDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')
  const [conversations, setConversations] = useState<Record<string, Message[]>>({})
  const [meta, setMeta] = useState<Record<string, ConvMeta>>({})
  const [users, setUsers] = useState<ChatUser[]>(() => buildInitialUsers())
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const [inChatSearch, setInChatSearch] = useState('')
  const [showInChatSearch, setShowInChatSearch] = useState(false)
  const [showArchivedMsgs, setShowArchivedMsgs] = useState(false)
  const isAdmin = currentUser?.role === 'Admin'

  // Dialogs
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false)
  const [isStarredOpen, setIsStarredOpen] = useState(false)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null)
  const [callState, setCallState] = useState<null | { type: 'voice' | 'video'; seconds: number }>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Voice recording
  const [recording, setRecording] = useState<{ seconds: number } | null>(null)
  const recordTimer = useRef<number | null>(null)
  const callTimer = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Load persisted state
  useEffect(() => {
    try {
      const c = localStorage.getItem(STORAGE_KEY)
      const m = localStorage.getItem(META_KEY)
      const u = localStorage.getItem(USERS_KEY)
      if (c) setConversations(JSON.parse(c))
      if (m) setMeta(JSON.parse(m))
      if (u) {
        const stored: ChatUser[] = JSON.parse(u)
        // Merge: keep stored groups + added; refresh employee list from source
        const base = buildInitialUsers()
        const extras = stored.filter(s => !base.find(b => b.id === s.id))
        setUsers([...base, ...extras])
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations)) } catch {}
  }, [conversations])

  useEffect(() => {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch {}
  }, [meta])

  useEffect(() => {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)) } catch {}
  }, [users])

  // Available users (role-aware)
  const availableUsers = useMemo(() => {
    if (currentUser?.role === 'Guest' && currentUser.linkedEmployee) {
      return users.filter(u => u.name === currentUser.linkedEmployee)
    }
    return users
  }, [users, currentUser])

  const filteredUsers = useMemo(() => {
    return availableUsers
      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(u => {
        const m = meta[u.id] || {}
        if (filter === 'archived') return m.archived
        if (m.archived) return false
        if (filter === 'unread') return u.unreadCount > 0
        return true
      })
      .sort((a, b) => {
        const pa = meta[a.id]?.pinned ? 1 : 0
        const pb = meta[b.id]?.pinned ? 1 : 0
        return pb - pa
      })
  }, [availableUsers, searchTerm, filter, meta])

  // Auto-select first
  useEffect(() => {
    if (!selectedUser && availableUsers.length > 0) setSelectedUser(availableUsers[0])
  }, [availableUsers, selectedUser])

  // Ensure conversation exists for the selected user
  useEffect(() => {
    if (selectedUser && !conversations[selectedUser.id]) {
      setConversations(prev => ({
        ...prev,
        [selectedUser.id]: seedMessages(selectedUser.id).map(m => ({
          ...m,
          senderName: m.senderId === 'me' ? 'You' : selectedUser.name,
        })),
      }))
    }
    // Clear unread on open
    if (selectedUser && selectedUser.unreadCount > 0) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unreadCount: 0 } : u))
    }
  }, [selectedUser])

  const messages = selectedUser ? (conversations[selectedUser.id] || []) : []
  const archivedCount = messages.filter(m => m.archived).length
  const baseMessages = showArchivedMsgs ? messages : messages.filter(m => !m.archived)
  const visibleMessages = inChatSearch
    ? baseMessages.filter(m => m.content.toLowerCase().includes(inChatSearch.toLowerCase()))
    : baseMessages

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selectedUser?.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      default: return 'bg-gray-400'
    }
  }

  const appendMessage = (uid: string, m: Message) => {
    setConversations(prev => ({ ...prev, [uid]: [...(prev[uid] || []), m] }))
  }

  const updateMessage = (uid: string, id: string, patch: Partial<Message>) => {
    setConversations(prev => ({
      ...prev,
      [uid]: (prev[uid] || []).map(m => m.id === id ? { ...m, ...patch } : m),
    }))
  }

  const handleSendMessage = () => {
    if (!draft.trim() || !selectedUser) return
    if (editingId) {
      updateMessage(selectedUser.id, editingId, { content: draft, edited: true })
      setEditingId(null)
      setDraft('')
      setReplyTo(null)
      return
    }
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: 'You',
      content: draft,
      type: 'text',
      timestamp: now(),
      status: 'sent',
      replyTo: replyTo ? { id: replyTo.id, content: replyTo.content.slice(0, 80), senderName: replyTo.senderName } : undefined,
    }
    appendMessage(selectedUser.id, newMessage)
    setDraft('')
    setReplyTo(null)

    // Simulate delivered/read + typing reply
    setTimeout(() => updateMessage(selectedUser.id, newMessage.id, { status: 'delivered' }), 500)
    setTimeout(() => updateMessage(selectedUser.id, newMessage.id, { status: 'read' }), 1400)
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      appendMessage(selectedUser.id, {
        id: (Date.now() + 1).toString(),
        senderId: selectedUser.id,
        senderName: selectedUser.name,
        content: getRandomResponse(),
        type: 'text',
        timestamp: now(),
        status: 'read',
      })
    }, 1800)
  }

  const getRandomResponse = () => {
    const r = [
      "I'll look into that right away.",
      "Thanks for the update — let me know if you need anything else.",
      "Sounds good. When do you need this by?",
      "I've just sent you the files you requested.",
      "Can we schedule a meeting to discuss this further?",
      "I'll have that ready for you by tomorrow.",
    ]
    return r[Math.floor(Math.random() * r.length)]
  }

  const handleFileUpload = (type: 'image' | 'file') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'image' ? 'image/*' : '*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !selectedUser) return
      const reader = new FileReader()
      reader.onload = () => {
        appendMessage(selectedUser.id, {
          id: Date.now().toString(),
          senderId: 'me',
          senderName: 'You',
          content: file.name,
          type,
          timestamp: now(),
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
          status: 'sent',
        })
        toast({ title: 'Sent', description: `${file.name} shared.` })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const startCall = (type: 'voice' | 'video') => {
    if (!selectedUser) return
    setCallState({ type, seconds: 0 })
    callTimer.current = window.setInterval(() => {
      setCallState(prev => prev ? { ...prev, seconds: prev.seconds + 1 } : prev)
    }, 1000)
  }
  const endCall = () => {
    if (callTimer.current) window.clearInterval(callTimer.current)
    callTimer.current = null
    if (callState && selectedUser) {
      toast({ title: 'Call ended', description: `${callState.type === 'voice' ? 'Voice' : 'Video'} call — ${formatDuration(callState.seconds)}` })
    }
    setCallState(null)
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }

  const startRecording = () => {
    if (recording) return stopRecording()
    setRecording({ seconds: 0 })
    recordTimer.current = window.setInterval(() => {
      setRecording(prev => prev ? { seconds: prev.seconds + 1 } : prev)
    }, 1000)
  }
  const stopRecording = () => {
    if (recordTimer.current) window.clearInterval(recordTimer.current)
    recordTimer.current = null
    const sec = recording?.seconds ?? 0
    setRecording(null)
    if (!selectedUser || sec < 1) return
    appendMessage(selectedUser.id, {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: 'You',
      content: 'voice-message',
      type: 'voice',
      timestamp: now(),
      fileName: 'voice-message.webm',
      duration: sec,
      status: 'sent',
    })
  }
  const cancelRecording = () => {
    if (recordTimer.current) window.clearInterval(recordTimer.current)
    recordTimer.current = null
    setRecording(null)
  }

  const toggleMeta = (uid: string, key: keyof ConvMeta) => {
    setMeta(prev => ({ ...prev, [uid]: { ...prev[uid], [key]: !prev[uid]?.[key] } }))
  }

  const handleDeleteChat = () => {
    if (!selectedUser) return
    setConversations(prev => { const n = { ...prev }; delete n[selectedUser.id]; return n })
    toast({ title: 'Chat deleted', description: `Chat with ${selectedUser.name} cleared.`, variant: 'destructive' })
  }

  const handleDeleteMessage = (id: string) => {
    if (!selectedUser) return
    if (!isAdmin) {
      toast({ title: 'Not allowed', description: 'Only Admins can delete messages.', variant: 'destructive' })
      return
    }
    setConversations(prev => ({ ...prev, [selectedUser.id]: prev[selectedUser.id].filter(m => m.id !== id) }))
  }

  const handleArchiveMessage = (m: Message) => {
    if (!selectedUser) return
    updateMessage(selectedUser.id, m.id, { archived: !m.archived })
    toast({ title: m.archived ? 'Unarchived' : 'Message archived' })
  }

  const handleCopyMessage = (m: Message) => {
    navigator.clipboard.writeText(m.content).then(() => toast({ title: 'Copied' }))
  }

  const handleStarMessage = (m: Message) => {
    if (!selectedUser) return
    updateMessage(selectedUser.id, m.id, { starred: !m.starred })
  }

  const handleEditMessage = (m: Message) => {
    if (m.type !== 'text' || m.senderId !== 'me') return
    setEditingId(m.id)
    setDraft(m.content)
    inputRef.current?.focus()
  }

  const insertEmoji = (e: string) => {
    setDraft(prev => prev + e)
    inputRef.current?.focus()
  }

  const downloadFile = (m: Message) => {
    if (!m.dataUrl) {
      toast({ title: 'Unavailable', description: 'File data is not stored locally.' })
      return
    }
    const a = document.createElement('a')
    a.href = m.dataUrl
    a.download = m.fileName || 'file'
    a.click()
  }

  const starredMessages = useMemo(() => {
    const all: { user: ChatUser; m: Message }[] = []
    Object.entries(conversations).forEach(([uid, msgs]) => {
      const u = users.find(u => u.id === uid)
      if (!u) return
      msgs.filter(m => m.starred).forEach(m => all.push({ user: u, m }))
    })
    return all
  }, [conversations, users])

  const startConversation = (selected: ChatUser[], groupName?: string) => {
    if (selected.length === 0) return
    if (selected.length === 1) {
      setSelectedUser(selected[0])
      setIsNewChatOpen(false)
      return
    }
    // Create a group
    const id = `grp-${Date.now()}`
    const group: ChatUser = {
      id,
      name: groupName?.trim() || selected.map(s => s.name.split(' ')[0]).join(', '),
      status: 'online',
      lastSeen: 'just now',
      unreadCount: 0,
      role: `Group · ${selected.length} members`,
      isGroup: true,
      members: selected.map(s => ({ id: s.id, name: s.name, avatar: s.avatar })),
    }
    setUsers(prev => [group, ...prev])
    setSelectedUser(group)
    setIsNewChatOpen(false)
    toast({ title: 'Group created', description: `${group.name} (${selected.length} members)` })
  }

  const handleForward = (targetIds: string[]) => {
    if (!forwardMsg) return
    targetIds.forEach(uid => {
      appendMessage(uid, {
        ...forwardMsg,
        id: `${Date.now()}-${uid}`,
        senderId: 'me',
        senderName: 'You',
        timestamp: now(),
        status: 'sent',
        forwarded: true,
        replyTo: undefined,
        starred: false,
      })
    })
    toast({ title: 'Forwarded', description: `Sent to ${targetIds.length} chat${targetIds.length > 1 ? 's' : ''}` })
    setForwardMsg(null)
  }

  const StatusIcon = ({ status }: { status?: Message['status'] }) => {
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 opacity-70" />
    return <Check className="w-3.5 h-3.5 opacity-70" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Communication Hub</h1>
          <p className="text-muted-foreground">
            Messaging, voice & video calls, file sharing — all in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsStarredOpen(true)}>
            <Star className="w-4 h-4 mr-2" /> Starred
          </Button>
          <Button onClick={() => setIsNewChatOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> New Chat
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-13rem)] space-x-4">
        {/* Chat List */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredUsers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No conversations</p>
                )}
                {filteredUsers.map((user) => {
                  const m = meta[user.id] || {}
                  const lastMsg = (conversations[user.id] || []).slice(-1)[0]
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        'group flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors',
                        selectedUser?.id === user.id ? 'bg-accent' : 'hover:bg-accent/50'
                      )}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.isGroup ? <Users className="w-5 h-5" /> : user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn('absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background', getStatusColor(user.status))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate flex items-center gap-1">
                            {m.pinned && <Pin className="w-3 h-3 text-muted-foreground" />}
                            {user.name}
                          </p>
                          <div className="flex items-center gap-1">
                            {m.muted && <BellOff className="w-3 h-3 text-muted-foreground" />}
                            {user.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">{user.unreadCount}</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMsg ? (lastMsg.type === 'text' ? lastMsg.content : `[${lastMsg.type}] ${lastMsg.fileName || ''}`) : (user.status === 'online' ? 'Online' : `Last seen ${user.lastSeen}`)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        {selectedUser ? (
          <Card className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>
                        {selectedUser.isGroup ? <Users className="w-5 h-5" /> : selectedUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn('absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background', getStatusColor(selectedUser.status))} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {typing ? <span className="text-primary">typing…</span>
                        : selectedUser.isGroup ? `${selectedUser.members?.length || 0} members`
                        : (selectedUser.status === 'online' ? 'Online' : `Last seen ${selectedUser.lastSeen}`)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setShowInChatSearch(s => !s)} title="Search in chat">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startCall('voice')} title="Voice call">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startCall('video')} title="Video call">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsUserInfoOpen(true)} title="Contact info">
                    <Info className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleMeta(selectedUser.id, 'pinned')}>
                        <Pin className="w-4 h-4 mr-2" /> {meta[selectedUser.id]?.pinned ? 'Unpin' : 'Pin'} Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleMeta(selectedUser.id, 'muted')}>
                        {meta[selectedUser.id]?.muted ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
                        {meta[selectedUser.id]?.muted ? 'Unmute' : 'Mute'} Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsGroupDialogOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" /> Add to Group
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsChatSettingsOpen(true)}>
                        <Settings className="w-4 h-4 mr-2" /> Chat Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowArchivedMsgs(s => !s)}>
                        {showArchivedMsgs ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                        {showArchivedMsgs ? 'Hide archived messages' : `Show archived messages${archivedCount ? ` (${archivedCount})` : ''}`}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleMeta(selectedUser.id, 'archived')}>
                        {meta[selectedUser.id]?.archived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                        {meta[selectedUser.id]?.archived ? 'Unarchive' : 'Archive'} Chat
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem onClick={handleDeleteChat} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Chat
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {showInChatSearch && (
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search in this conversation..."
                    value={inChatSearch}
                    onChange={(e) => setInChatSearch(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              )}
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {visibleMessages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-12">No messages found</p>
                  )}
                  {visibleMessages.map((msg) => {
                    const mine = msg.senderId === 'me'
                    return (
                      <div key={msg.id} className={cn('group flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                        {!mine && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={selectedUser.avatar} />
                            <AvatarFallback className="text-xs">{selectedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          'relative max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-sm',
                          mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-accent rounded-bl-sm',
                          msg.archived && 'opacity-60 ring-1 ring-muted-foreground/30'
                        )}>
                          {msg.forwarded && (
                            <div className={cn('text-xs mb-1 flex items-center gap-1 italic', mine ? 'opacity-80' : 'opacity-70')}>
                              <Forward className="w-3 h-3" /> Forwarded
                            </div>
                          )}
                          {msg.replyTo && (
                            <div className={cn('text-xs mb-1 pl-2 border-l-2', mine ? 'border-primary-foreground/40 opacity-80' : 'border-primary/50 opacity-80')}>
                              <p className="font-semibold">{msg.replyTo.senderName}</p>
                              <p className="truncate">{msg.replyTo.content}</p>
                            </div>
                          )}
                          {msg.type === 'text' && <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>}
                          {msg.type === 'image' && (
                            <div className="space-y-1">
                              {msg.dataUrl ? (
                                <img
                                  src={msg.dataUrl}
                                  alt={msg.fileName}
                                  className="rounded-md max-w-full max-h-64 cursor-pointer object-cover"
                                  onClick={() => setImagePreview(msg.dataUrl!)}
                                />
                              ) : (
                                <div className="w-48 h-32 bg-muted rounded border flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                              <p className="text-xs opacity-80">{msg.fileName} · {msg.fileSize}</p>
                            </div>
                          )}
                          {msg.type === 'file' && (
                            <div className="flex items-center gap-2">
                              <FileIcon className="w-5 h-5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm truncate">{msg.fileName}</p>
                                <p className="text-xs opacity-70">{msg.fileSize}</p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => downloadFile(msg)}>
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                          {msg.type === 'voice' && (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full bg-background/20" onClick={() => toast({ title: 'Playing voice message' })}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <div className="flex items-end gap-0.5 h-6">
                                {[3,5,8,4,6,9,5,7,4,6].map((h,i) => (
                                  <span key={i} className={cn('w-0.5 rounded', mine ? 'bg-primary-foreground/70' : 'bg-foreground/60')} style={{ height: `${h*2}px` }} />
                                ))}
                              </div>
                              <span className="text-xs opacity-80">{formatDuration(msg.duration || 0)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            {msg.starred && <Star className="w-3 h-3 fill-current" />}
                            {msg.edited && <span className="text-[10px] opacity-70">edited</span>}
                            <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                            {mine && <StatusIcon status={msg.status} />}
                          </div>

                          {/* Hover actions */}
                          <div className={cn(
                            'absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-popover border rounded-full shadow px-1 py-0.5',
                            mine ? 'right-2' : 'left-2'
                          )}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReplyTo(msg)} title="Reply">
                              <Reply className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setForwardMsg(msg)} title="Forward">
                              <Forward className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleStarMessage(msg)} title="Star">
                              <Star className={cn('h-3 w-3', msg.starred && 'fill-current text-yellow-500')} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleCopyMessage(msg)} title="Copy">
                              <Copy className="h-3 w-3" />
                            </Button>
                            {mine && msg.type === 'text' && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEditMessage(msg)} title="Edit">
                                <CornerUpLeft className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleArchiveMessage(msg)} title={msg.archived ? 'Unarchive' : 'Archive'}>
                              {msg.archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteMessage(msg.id)} title="Delete">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {typing && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={selectedUser.avatar} />
                        <AvatarFallback className="text-xs">{selectedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="bg-accent rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Reply / Edit banner */}
            {(replyTo || editingId) && (
              <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {editingId ? <CornerUpLeft className="w-4 h-4" /> : <Reply className="w-4 h-4" />}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{editingId ? 'Editing message' : `Replying to ${replyTo?.senderName}`}</p>
                    <p className="text-xs text-muted-foreground truncate">{editingId ? draft : replyTo?.content}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setReplyTo(null); setEditingId(null); setDraft('') }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Recording bar */}
            {recording && (
              <div className="px-4 py-2 border-t bg-destructive/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm">Recording… {formatDuration(recording.seconds)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelRecording}>Cancel</Button>
                  <Button size="sm" onClick={stopRecording}><Send className="w-4 h-4 mr-1" />Send</Button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleFileUpload('file')} title="Attach file">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleFileUpload('image')} title="Attach image">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={editingId ? 'Edit your message...' : 'Type a message...'}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                    className="pr-10"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Emoji">
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="end">
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJIS.map(e => (
                            <button key={e} onClick={() => insertEmoji(e)} className="text-xl hover:bg-accent rounded p-1">{e}</button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {draft.trim() || editingId ? (
                  <Button onClick={handleSendMessage}><Send className="w-4 h-4" /></Button>
                ) : (
                  <Button variant={recording ? 'destructive' : 'default'} onClick={startRecording} title="Record voice">
                    {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
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
              <DialogTitle>Contact Information</DialogTitle>
              <DialogDescription>Details and shared content</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{selectedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.role || 'Team member'}</p>
                  <Badge variant="outline" className="mt-1 capitalize">{selectedUser.status}</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-accent">
                  <p className="text-lg font-semibold">{messages.length}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div className="p-2 rounded bg-accent">
                  <p className="text-lg font-semibold">{messages.filter(m => m.type !== 'text').length}</p>
                  <p className="text-xs text-muted-foreground">Media</p>
                </div>
                <div className="p-2 rounded bg-accent">
                  <p className="text-lg font-semibold">{messages.filter(m => m.starred).length}</p>
                  <p className="text-xs text-muted-foreground">Starred</p>
                </div>
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
            <DialogDescription>Select a group to add {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {['HR Team', 'Project Alpha', 'Management', 'Design Crew'].map((group) => (
              <Button
                key={group}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  toast({ title: 'Added to group', description: `${selectedUser?.name} added to ${group}` })
                  setIsGroupDialogOpen(false)
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />{group}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Settings */}
      <Dialog open={isChatSettingsOpen} onOpenChange={setIsChatSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
            <DialogDescription>Manage how this conversation behaves</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pin">Pin conversation</Label>
              <Switch id="pin" checked={!!meta[selectedUser?.id || '']?.pinned} onCheckedChange={() => selectedUser && toggleMeta(selectedUser.id, 'pinned')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mute">Mute notifications</Label>
              <Switch id="mute" checked={!!meta[selectedUser?.id || '']?.muted} onCheckedChange={() => selectedUser && toggleMeta(selectedUser.id, 'muted')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="arch">Archive</Label>
              <Switch id="arch" checked={!!meta[selectedUser?.id || '']?.archived} onCheckedChange={() => selectedUser && toggleMeta(selectedUser.id, 'archived')} />
            </div>
            <Separator />
            <Button variant="destructive" className="w-full" onClick={() => { handleDeleteChat(); setIsChatSettingsOpen(false) }}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Starred Messages */}
      <Dialog open={isStarredOpen} onOpenChange={setIsStarredOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Starred Messages</DialogTitle>
            <DialogDescription>All messages you've marked as important</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {starredMessages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">No starred messages yet</p>
              )}
              {starredMessages.map(({ user, m }) => (
                <div key={m.id} className="p-3 border rounded-lg flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{user.name}</p>
                      <span className="text-xs text-muted-foreground">{m.timestamp}</span>
                    </div>
                    <p className="text-sm truncate">{m.content}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setIsStarredOpen(false) }}>
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* New Chat */}
      <NewChatDialog
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        employees={users.filter(u => !u.isGroup)}
        onStart={startConversation}
      />

      {/* Forward Dialog */}
      <ForwardDialog
        message={forwardMsg}
        onOpenChange={(o) => !o && setForwardMsg(null)}
        targets={users.filter(u => u.id !== selectedUser?.id)}
        onForward={handleForward}
      />

      {/* Call Overlay */}
      {callState && selectedUser && (
        <Dialog open onOpenChange={(o) => !o && endCall()}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{callState.type === 'voice' ? 'Voice Call' : 'Video Call'}</DialogTitle>
              <DialogDescription>Connected with {selectedUser.name}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback className="text-2xl">{selectedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-lg">{selectedUser.name}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{formatDuration(callState.seconds)}</p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button variant="destructive" onClick={endCall} className="rounded-full px-6">
                <Phone className="w-4 h-4 mr-2 rotate-[135deg]" /> End Call
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <Dialog open onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Image Preview</DialogTitle></DialogHeader>
            <img src={imagePreview} alt="preview" className="w-full max-h-[70vh] object-contain rounded" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function NewChatDialog({ open, onOpenChange, employees, onStart }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  employees: ChatUser[]
  onStart: (selected: ChatUser[], groupName?: string) => void
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [groupName, setGroupName] = useState('')

  useEffect(() => { if (!open) { setSelectedIds([]); setSearch(''); setGroupName('') } }, [open])

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.role || '').toLowerCase().includes(search.toLowerCase())
  )
  const selected = employees.filter(e => selectedIds.includes(e.id))
  const isGroup = selectedIds.length >= 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Select one employee for a direct chat, or two or more to create a group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map(s => (
                <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                  {s.name}
                  <button onClick={() => toggle(s.id)} className="hover:bg-background/50 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {isGroup && (
            <div className="space-y-1.5">
              <Label htmlFor="gname">Group name (optional)</Label>
              <Input id="gname" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Design Crew" />
            </div>
          )}

          <ScrollArea className="h-72 border rounded-md">
            <div className="p-1">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No employees found</p>
              )}
              {filtered.map(emp => {
                const checked = selectedIds.includes(emp.id)
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggle(emp.id)}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                      checked ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(emp.id)} onClick={(e) => e.stopPropagation()} />
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={emp.avatar} />
                      <AvatarFallback className="text-xs">{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.role || 'Team member'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={selectedIds.length === 0} onClick={() => onStart(selected, groupName)}>
            {isGroup ? <><Users className="w-4 h-4 mr-2" />Create Group</> : <><MessageSquare className="w-4 h-4 mr-2" />Start Chat</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ForwardDialog({ message, onOpenChange, targets, onForward }: {
  message: Message | null
  onOpenChange: (v: boolean) => void
  targets: ChatUser[]
  onForward: (targetIds: string[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  useEffect(() => { if (!message) { setSelectedIds([]); setSearch('') } }, [message])
  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const filtered = targets.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
  const preview = message
    ? (message.type === 'text' ? message.content : `[${message.type}] ${message.fileName || ''}`)
    : ''

  return (
    <Dialog open={!!message} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>Select one or more chats to forward to</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-2 border rounded-md bg-muted/30 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Forwarding:</p>
            <p className="truncate">{preview}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search chats..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-1">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No chats</p>
              )}
              {filtered.map(t => {
                const checked = selectedIds.includes(t.id)
                return (
                  <div
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={cn('flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors', checked ? 'bg-accent' : 'hover:bg-accent/50')}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(t.id)} onClick={(e) => e.stopPropagation()} />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={t.avatar} />
                      <AvatarFallback className="text-xs">
                        {t.isGroup ? <Users className="w-4 h-4" /> : t.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.role || (t.isGroup ? 'Group' : '')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={selectedIds.length === 0} onClick={() => onForward(selectedIds)}>
            <Forward className="w-4 h-4 mr-2" />Forward{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
