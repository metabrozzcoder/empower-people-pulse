import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare, Send, Search, Smile, Check, CheckCheck, Bell, BellOff,
  Phone, Video, Plus, Users, UserPlus, Paperclip, X, FileText, Download, Image as ImageIcon,
  Film, Music, Loader2,
} from 'lucide-react'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Trash2, Settings } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import CallDialog from '@/components/CallDialog'
import { formatTime, formatDate } from '@/lib/date'


interface ChatUser {
  id: string
  name: string
  avatar?: string
  role?: string
  unreadCount: number
  lastSeen?: string | null
}

interface Attachment {
  path: string
  name: string
  size: number
  type: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  edited?: boolean
  attachments?: Attachment[]
  read_at?: string | null
}

const EMOJIS = ['😊','😂','❤️','👍','🎉','🔥','🙏','👏','😍','🤔','😎','💯','✅','🚀','💡']

const fmtTime = (iso: string) => {
  try { return formatTime(iso) } catch { return '' }
}

const fmtLastSeen = (iso?: string | null): string => {
  if (!iso) return 'offline'
  const d = new Date(iso).getTime()
  if (isNaN(d)) return 'offline'
  const diff = Date.now() - d
  if (diff < 90_000) return 'online'
  if (diff < 3_600_000) return `last seen ${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `last seen ${Math.floor(diff / 3_600_000)}h ago`
  return `last seen ${formatDate(iso)}`
}

const isSameDay = (a: string, b: string) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

const dayLabel = (iso: string): string => {
  const today = new Date().toISOString()
  const y = new Date(); y.setDate(new Date().getDate() - 1)
  const yest = y.toISOString()
  if (isSameDay(iso, today)) return 'Today'
  if (isSameDay(iso, yest)) return 'Yesterday'
  return formatDate(iso)
}

export default function Chat() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { currentUser, session } = useAuth()
  const myId = session?.user.id

  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [convByUser, setConvByUser] = useState<Record<string, string>>({}) // userId -> conversationId
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const selectedUserRef = useRef<ChatUser | null>(null)
  useEffect(() => { selectedUserRef.current = selectedUser }, [selectedUser])
  const usersRef = useRef<ChatUser[]>([])
  useEffect(() => { usersRef.current = users }, [users])
  const callRef = useRef<any>(null)

  // Groups
  interface GroupConv { id: string; name: string; memberCount: number; created_by: string | null }
  const [groups, setGroups] = useState<GroupConv[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [listTab, setListTab] = useState<'people' | 'groups'>('people')

  // Dialogs
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState<Set<string>>(new Set())

  // Group settings
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false)
  const [groupMemberProfiles, setGroupMemberProfiles] = useState<Array<{ id: string; name: string; avatar?: string; role?: string }>>([])

  // Calls
  const [call, _setCall] = useState<null | { mode: 'audio' | 'video'; role: 'caller' | 'callee'; conversationId: string; peer: { id: string; name: string; avatar?: string } }>(null)
  const setCall = (v: any) => { callRef.current = v; _setCall(v) }


  // Request browser notification permission
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') { setNotifEnabled(true); return }
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotifEnabled(p === 'granted'))
    }
  }, [])

  // Safety: ensure body interactions aren't left disabled by a stale Radix overlay
  useEffect(() => {
    if (!newChatOpen && !newGroupOpen) {
      const t = setTimeout(() => {
        if (document.body.style.pointerEvents === 'none') document.body.style.pointerEvents = ''
      }, 200)
      return () => clearTimeout(t)
    }
  }, [newChatOpen, newGroupOpen])

  // Load users (other profiles)
  const loadUsers = useCallback(async () => {
    if (!myId) return
    const { data } = await supabase
      .from('profiles_public' as never)
      .select('id, name, avatar_url, position, last_seen')
      .order('name')
    const list: ChatUser[] = (data ?? [])
      .filter((p: any) => p.id !== myId)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar_url ?? undefined,
        role: p.position ?? undefined,
        unreadCount: 0,
        lastSeen: p.last_seen ?? null,
      }))
    setUsers(prev => list.map(nu => {
      const old = prev.find(o => o.id === nu.id)
      return old ? { ...nu, unreadCount: old.unreadCount } : nu
    }))
  }, [myId])
  useEffect(() => { loadUsers() }, [loadUsers])

  // Heartbeat: refresh my last_seen and refresh peer list periodically
  useEffect(() => {
    if (!myId) return
    const beat = () => { supabase.rpc('touch_last_seen' as never).then(() => loadUsers()) }
    beat()
    const iv = setInterval(beat, 45_000)
    const onVis = () => { if (document.visibilityState === 'visible') beat() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', onVis) }
  }, [myId, loadUsers])


  // Load existing DM conversations the user is in -> map user->conv
  const refreshConvMap = useCallback(async () => {
    if (!myId) return
    const { data: myMems } = await supabase
      .from('conversation_members')
      .select('conversation_id')
    const convIds = (myMems ?? []).map(m => m.conversation_id)
    if (convIds.length === 0) return
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, is_group')
      .in('id', convIds)
      .eq('is_group', false)
    const dmIds = (convs ?? []).map(c => c.id)
    if (dmIds.length === 0) return
    const { data: allMems } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', dmIds)
    const map: Record<string, string> = {}
    const byConv: Record<string, string[]> = {}
    ;(allMems ?? []).forEach(m => {
      byConv[m.conversation_id] = byConv[m.conversation_id] || []
      byConv[m.conversation_id].push(m.user_id)
    })
    Object.entries(byConv).forEach(([cid, uids]) => {
      const other = uids.find(u => u !== myId)
      if (other && uids.includes(myId)) map[other] = cid
    })
    setConvByUser(map)
  }, [myId])

  useEffect(() => { refreshConvMap() }, [refreshConvMap])

  // Load groups
  const refreshGroups = useCallback(async () => {
    if (!myId) return
    const { data: myMems } = await supabase.from('conversation_members').select('conversation_id')
    const convIds = (myMems ?? []).map(m => m.conversation_id)
    if (convIds.length === 0) { setGroups([]); return }
    const { data: convs } = await supabase
      .from('conversations').select('id, name, is_group, created_by').in('id', convIds).eq('is_group', true)
    const gIds = (convs ?? []).map(c => c.id)
    if (gIds.length === 0) { setGroups([]); return }
    const { data: allMems } = await supabase
      .from('conversation_members').select('conversation_id, user_id').in('conversation_id', gIds)
    const counts: Record<string, number> = {}
    ;(allMems ?? []).forEach(m => { counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1 })
    setGroups((convs ?? []).map((c: any) => ({ id: c.id, name: c.name || 'Untitled group', memberCount: counts[c.id] || 0, created_by: c.created_by ?? null })))
  }, [myId])
  useEffect(() => { refreshGroups() }, [refreshGroups])

  const loadGroupMembers = useCallback(async (convId: string) => {
    const { data: mems } = await supabase
      .from('conversation_members').select('user_id').eq('conversation_id', convId)
    const ids = (mems ?? []).map(m => m.user_id)
    if (ids.length === 0) { setGroupMemberProfiles([]); return }
    const { data: profs } = await supabase
      .from('profiles_public' as never).select('id, name, avatar_url, position').in('id', ids)
    setGroupMemberProfiles((profs ?? []).map((p: any) => ({
      id: p.id, name: p.name, avatar: p.avatar_url ?? undefined, role: p.position ?? undefined,
    })))
  }, [])

  const openGroupSettings = async () => {
    if (!selectedGroupId) return
    await loadGroupMembers(selectedGroupId)
    setGroupSettingsOpen(true)
  }

  const deleteGroup = async () => {
    if (!selectedGroupId) return
    const { error } = await supabase.from('conversations').delete().eq('id', selectedGroupId)
    if (error) { toast({ title: 'Failed to delete group', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Group deleted' })
    setGroupSettingsOpen(false)
    setSelectedGroupId(null)
    await refreshGroups()
  }


  // Incoming ring channel
  useEffect(() => {
    if (!myId) return
    const ch = supabase.channel(`ring-${myId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'ring' }, ({ payload }) => {
        if (payload.from === myId || callRef.current) return
        const peer = usersRef.current.find(u => u.id === payload.from)
        // Defer to next tick so we don't block the realtime callback
        setTimeout(() => {
          const accept = window.confirm(`${peer?.name || 'Someone'} is calling (${payload.mode}). Accept?`)
          if (accept) {
            setCall({ mode: payload.mode, role: 'callee', conversationId: payload.conversationId, peer: { id: payload.from, name: peer?.name || 'Caller', avatar: peer?.avatar } })
          } else {
            supabase.channel(`call-${payload.conversationId}`).send({ type: 'broadcast', event: 'call-end', payload: { from: myId } })
          }
        }, 0)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [myId])

  const startCall = async (mode: 'audio' | 'video') => {
    if (!selectedUser || !myId) return
    const convId = await getOrCreateDm(selectedUser.id)
    if (!convId) return
    const ringCh = supabase.channel(`ring-${selectedUser.id}`)
    await new Promise<void>((resolve) => { ringCh.subscribe((st) => { if (st === 'SUBSCRIBED') resolve() }) })
    await ringCh.send({ type: 'broadcast', event: 'ring', payload: { from: myId, conversationId: convId, mode } })
    supabase.removeChannel(ringCh)
    setCall({ mode, role: 'caller', conversationId: convId, peer: { id: selectedUser.id, name: selectedUser.name, avatar: selectedUser.avatar } })
  }

  const createGroup = async () => {
    if (!myId || !groupName.trim() || groupMembers.size === 0) return
    const { data: conv, error } = await supabase
      .from('conversations').insert({ is_group: true, name: groupName.trim(), created_by: myId }).select('id').single()
    if (error || !conv) { toast({ title: 'Failed to create group', description: error?.message, variant: 'destructive' }); return }
    const members = [myId, ...Array.from(groupMembers)].map(uid => ({ conversation_id: conv.id, user_id: uid }))
    const { error: mErr } = await supabase.from('conversation_members').insert(members)
    if (mErr) { toast({ title: 'Failed to add members', description: mErr.message, variant: 'destructive' }); return }
    toast({ title: 'Group created', description: groupName })
    setGroupName(''); setGroupMembers(new Set()); setNewGroupOpen(false)
    await refreshGroups()
    setTimeout(() => { setListTab('groups'); setSelectedUser(null); setSelectedGroupId(conv.id) }, 50)
  }


  const getOrCreateDm = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!myId) return null
    if (convByUser[otherUserId]) return convByUser[otherUserId]
    // Create conversation
    const { data: conv, error: cErr } = await supabase
      .from('conversations')
      .insert({ is_group: false, created_by: myId })
      .select('id')
      .single()
    if (cErr || !conv) {
      toast({ title: 'Failed to start chat', description: cErr?.message, variant: 'destructive' })
      return null
    }
    const { error: mErr } = await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: myId },
      { conversation_id: conv.id, user_id: otherUserId },
    ])
    if (mErr) {
      toast({ title: 'Failed to add members', description: mErr.message, variant: 'destructive' })
      return null
    }
    setConvByUser(prev => ({ ...prev, [otherUserId]: conv.id }))
    return conv.id
  }, [myId, convByUser, toast])

  // Ensure DM exists when selecting a user (does not load messages)
  useEffect(() => {
    if (!selectedUser || !myId) return
    if (convByUser[selectedUser.id]) return
    getOrCreateDm(selectedUser.id)
  }, [selectedUser, myId, convByUser, getOrCreateDm])

  // Load messages whenever the active conversation id is known/changes
  const activeConvId = selectedGroupId ?? (selectedUser ? convByUser[selectedUser.id] : undefined)
  useEffect(() => {
    if (!activeConvId || !myId) { setMessages([]); return }
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, edited, attachments, read_at')
        .eq('conversation_id', activeConvId)
        .order('created_at', { ascending: true })
        .limit(500)
      if (cancelled) return
      setMessages(prev => {
        const fetched = ((data ?? []) as any[]).map(r => ({ ...r, attachments: Array.isArray(r.attachments) ? r.attachments : [] })) as Message[]
        const ids = new Set(fetched.map(m => m.id))
        const extras = prev.filter(m => m.conversation_id === activeConvId && !ids.has(m.id))
        return [...fetched, ...extras]
      })
      // Mark incoming messages as read
      await supabase.rpc('mark_messages_read' as never, { _conv: activeConvId } as never)
      if (selectedUser) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unreadCount: 0 } : u))
      }
    })()
    return () => { cancelled = true }
  }, [activeConvId, myId])

  // Active conversation realtime subscription (INSERT + UPDATE for read receipts)
  useEffect(() => {
    if (!activeConvId || !myId) return
    const channel = supabase
      .channel(`messages-active-${activeConvId}-${myId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        const m = payload.new as Message
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
        if (m.sender_id !== myId && document.visibilityState === 'visible') {
          supabase.rpc('mark_messages_read' as never, { _conv: activeConvId } as never)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        const m = payload.new as Message
        setMessages(prev => prev.map(x => x.id === m.id ? { ...x, ...m, attachments: Array.isArray((m as any).attachments) ? (m as any).attachments : x.attachments } : x))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeConvId, myId])


  // Refresh conv map when I'm added to a new conversation
  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel(`cm-watch-${myId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'conversation_members',
        filter: `user_id=eq.${myId}`,
      }, () => { refreshConvMap() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId, refreshConvMap])

  // Global notification subscription: listen for all inserts and check if in our convs
  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel(`messages-notify-${myId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, async (payload) => {
        const m = payload.new as Message
        if (m.sender_id === myId) return
        let userId = Object.entries(convByUser).find(([, cid]) => cid === m.conversation_id)?.[0]
        if (!userId) {
          await refreshConvMap()
          if (selectedUserRef.current?.id && m.sender_id === selectedUserRef.current.id) {
            setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
          }
          return
        }
        const sender = users.find(u => u.id === userId)
        const isActive = selectedUserRef.current?.id === userId
        if (isActive) {
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
        } else {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, unreadCount: u.unreadCount + 1 } : u))
          toast({ title: sender?.name ?? 'New message', description: m.content.slice(0, 120) })
          if (notifEnabled && typeof Notification !== 'undefined' && document.visibilityState !== 'visible') {
            try {
              new Notification(sender?.name ?? 'New message', { body: m.content.slice(0, 200), icon: sender?.avatar })
            } catch {}
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId, convByUser, users, notifEnabled, toast, refreshConvMap])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selectedUser?.id])

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(u => filter === 'unread' ? u.unreadCount > 0 : true)
  }, [users, searchTerm, filter])

  // Auto-select first, or a user requested via sessionStorage (e.g. from Organizations "Message" button)
  useEffect(() => {
    if (users.length === 0) return
    const pending = typeof window !== 'undefined' ? sessionStorage.getItem('chat.startWithUser') : null
    if (pending) {
      const target = users.find(u => u.id === pending)
      if (target) {
        sessionStorage.removeItem('chat.startWithUser')
        setListTab('people')
        setSelectedGroupId(null)
        setSelectedUser(target)
        return
      }
    }
    if (!selectedUser && !selectedGroupId) setSelectedUser(users[0])
  }, [users, selectedUser, selectedGroupId])


  const uploadFilesToConv = async (convId: string, files: File[]): Promise<Attachment[]> => {
    const uploaded: Attachment[] = []
    for (const f of files) {
      if (f.size > 50 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${f.name} exceeds 50MB`, variant: 'destructive' })
        continue
      }
      const safeName = f.name.replace(/[^\w.\-]+/g, '_')
      const path = `${convId}/${crypto.randomUUID()}-${safeName}`
      const { error } = await supabase.storage.from('chat-attachments').upload(path, f, {
        contentType: f.type || 'application/octet-stream',
        upsert: false,
      })
      if (error) {
        toast({ title: 'Upload failed', description: `${f.name}: ${error.message}`, variant: 'destructive' })
        continue
      }
      uploaded.push({ path, name: f.name, size: f.size, type: f.type || 'application/octet-stream' })
    }
    return uploaded
  }

  const handleSend = async () => {
    if ((!draft.trim() && pendingFiles.length === 0) || !myId) return
    let convId: string | null = null
    if (selectedGroupId) convId = selectedGroupId
    else if (selectedUser) convId = await getOrCreateDm(selectedUser.id)
    if (!convId) return
    const content = draft.trim()
    const filesToSend = pendingFiles
    setDraft('')
    setPendingFiles([])
    let attachments: Attachment[] = []
    if (filesToSend.length > 0) {
      setUploading(true)
      attachments = await uploadFilesToConv(convId, filesToSend)
      setUploading(false)
      if (attachments.length === 0 && !content) return
    }
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: myId, content, attachments: attachments as any })
      .select('id, conversation_id, sender_id, content, created_at, edited, attachments, read_at')
      .single()
    if (error) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' })
      setDraft(content)
      setPendingFiles(filesToSend)
      return
    }
    if (data) {
      const msg = { ...(data as any), attachments: Array.isArray((data as any).attachments) ? (data as any).attachments : [] } as Message
      setMessages(prev => prev.some(x => x.id === msg.id) ? prev : [...prev, msg])
    }
  }

  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    if (signedUrls[path]) return signedUrls[path]
    const { data } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 3600)
    if (data?.signedUrl) {
      setSignedUrls(prev => ({ ...prev, [path]: data.signedUrl }))
      return data.signedUrl
    }
    return null
  }, [signedUrls])

  // Pre-sign attachments in the current view
  useEffect(() => {
    const paths = messages.flatMap(m => (m.attachments ?? []).map(a => a.path)).filter(p => !signedUrls[p])
    if (paths.length === 0) return
    ;(async () => {
      const entries: Record<string, string> = {}
      for (const p of paths) {
        const { data } = await supabase.storage.from('chat-attachments').createSignedUrl(p, 3600)
        if (data?.signedUrl) entries[p] = data.signedUrl
      }
      if (Object.keys(entries).length) setSignedUrls(prev => ({ ...prev, ...entries }))
    })()
  }, [messages, signedUrls])

  const activeGroup = groups.find(g => g.id === selectedGroupId) || null

  const insertEmoji = (e: string) => setDraft(prev => prev + e)

  const onFilesPicked = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).slice(0, 10)
    setPendingFiles(prev => [...prev, ...arr].slice(0, 10))
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const files = Array.from(e.clipboardData.files || [])
    if (files.length) {
      e.preventDefault()
      setPendingFiles(prev => [...prev, ...files].slice(0, 10))
    }
  }

  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`
  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (type.startsWith('video/')) return <Film className="w-4 h-4" />
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.chat.title', 'Chat')}</h1>
          <p className="text-muted-foreground">{t('pages.chat.subtitle', 'Send messages to your team in real time')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (typeof Notification === 'undefined') return
            Notification.requestPermission().then(p => {
              setNotifEnabled(p === 'granted')
              toast({ title: p === 'granted' ? 'Notifications enabled' : 'Notifications blocked' })
            })
          }}
        >
          {notifEnabled ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
          {notifEnabled ? 'Notifications on' : 'Enable notifications'}
        </Button>
      </div>

      <div className="flex h-[calc(100vh-13rem)] space-x-4">
        {/* List */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost"><Plus className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setNewChatOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> New chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNewGroupOpen(true)}>
                    <Users className="w-4 h-4 mr-2" /> New group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={listTab} onValueChange={(v) => setListTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {listTab === 'people' ? (
                  <>
                    {filteredUsers.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No users</p>
                    )}
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors',
                          selectedUser?.id === u.id && !selectedGroupId ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                        onClick={() => { setSelectedGroupId(null); setSelectedUser(u) }}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback>{u.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{u.name}</p>
                            {u.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">{u.unreadCount}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.role || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No groups yet</p>
                    )}
                    {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(g => (
                      <div
                        key={g.id}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors',
                          selectedGroupId === g.id ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                        onClick={() => { setSelectedUser(null); setSelectedGroupId(g.id) }}
                      >
                        <Avatar className="w-10 h-10"><AvatarFallback><Users className="w-4 h-4" /></AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{g.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{g.memberCount} members</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        {(selectedUser || activeGroup) ? (
          <Card className="flex-1 flex flex-col min-w-0">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center space-x-3">
                {activeGroup ? (
                  <>
                    <Avatar className="w-10 h-10"><AvatarFallback><Users className="w-4 h-4" /></AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{activeGroup.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{activeGroup.memberCount} members</p>
                    </div>
                  </>
                ) : selectedUser ? (
                  <>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback>{selectedUser.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{fmtLastSeen(selectedUser.lastSeen)}{selectedUser.role ? ` · ${selectedUser.role}` : ''}</p>
                    </div>
                    <Button size="icon" variant="ghost" title="Voice call" onClick={() => startCall('audio')}>
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Video call" onClick={() => startCall('video')}>
                      <Video className="w-4 h-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardHeader>


            <CardContent className="flex-1 p-0 min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-12">No messages yet. Say hi 👋</p>
                  )}
                  {messages.map((m, idx) => {
                    const mine = m.sender_id === myId
                    const prev = idx > 0 ? messages[idx - 1] : null
                    const showDay = !prev || !isSameDay(prev.created_at, m.created_at)
                    return (
                      <React.Fragment key={m.id}>
                        {showDay && (
                          <div className="flex justify-center my-2">
                            <span className="text-[11px] px-3 py-1 rounded-full bg-muted text-muted-foreground">
                              {dayLabel(m.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                        {!mine && selectedUser && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={selectedUser.avatar} />
                            <AvatarFallback className="text-xs">{selectedUser.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback>
                          </Avatar>
                        )}
                        {!mine && activeGroup && (
                          <Avatar className="w-7 h-7">
                            <AvatarFallback className="text-xs">{(users.find(u => u.id === m.sender_id)?.name || '?').slice(0,2)}</AvatarFallback>
                          </Avatar>
                        )}

                        <div className={cn(
                          'max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-sm space-y-2',
                          mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-accent rounded-bl-sm'
                        )}>
                          {(m.attachments ?? []).length > 0 && (
                            <div className="space-y-2">
                              {(m.attachments ?? []).map((a, i) => {
                                const url = signedUrls[a.path]
                                if (a.type.startsWith('image/') && url) {
                                  return (
                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                                      <img src={url} alt={a.name} className="rounded-lg max-h-64 object-cover" />
                                    </a>
                                  )
                                }
                                if (a.type.startsWith('video/') && url) {
                                  return <video key={i} src={url} controls className="rounded-lg max-h-64 w-full" />
                                }
                                if (a.type.startsWith('audio/') && url) {
                                  return <audio key={i} src={url} controls className="w-full" />
                                }
                                return (
                                  <a
                                    key={i}
                                    href={url || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={a.name}
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded-lg border text-xs hover:opacity-90 transition',
                                      mine ? 'border-primary-foreground/30 bg-primary-foreground/10' : 'bg-background/60 border-border'
                                    )}
                                  >
                                    {fileIcon(a.type)}
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate font-medium">{a.name}</p>
                                      <p className="opacity-70">{fmtSize(a.size)}</p>
                                    </div>
                                    <Download className="w-3.5 h-3.5 opacity-70" />
                                  </a>
                                )
                              })}
                            </div>
                          )}
                          {m.content && <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>}
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] opacity-70">{fmtTime(m.created_at)}</span>
                            {mine && (
                              m.read_at
                                ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                : <Check className="w-3.5 h-3.5 opacity-70" />
                            )}
                          </div>
                        </div>
                      </div>
                      </React.Fragment>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            <div className="border-t p-3 space-y-2">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-accent rounded-lg pl-2 pr-1 py-1 text-xs">
                      {fileIcon(f.type)}
                      <span className="max-w-[160px] truncate">{f.name}</span>
                      <span className="opacity-60">{fmtSize(f.size)}</span>
                      <button
                        className="p-1 hover:bg-background rounded"
                        onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                        aria-label="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div
                className="flex items-center gap-2"
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={(e) => { e.preventDefault(); onFilesPicked(e.dataTransfer.files) }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => { onFilesPicked(e.target.files); if (fileInputRef.current) fileInputRef.current.value = '' }}
                />
                <Button variant="ghost" size="sm" title="Attach files" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm"><Smile className="w-4 h-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJIS.map(e => (
                        <button key={e} className="text-xl hover:bg-accent rounded p-1" onClick={() => insertEmoji(e)}>{e}</button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  onPaste={handlePaste}
                  placeholder={pendingFiles.length ? 'Add a caption...' : 'Type a message, drop files, or paste an image...'}
                  className="flex-1"
                  disabled={uploading}
                />
                <Button onClick={handleSend} disabled={uploading || (!draft.trim() && pendingFiles.length === 0)}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>

          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a person to start chatting</p>
          </Card>
        )}
      </div>

      {/* New chat dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start a new chat</DialogTitle></DialogHeader>
          <Input placeholder="Search people..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <ScrollArea className="h-72">
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <div key={u.id}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setNewChatOpen(false)
                    setTimeout(() => {
                      setSelectedGroupId(null)
                      setSelectedUser(u)
                      setListTab('people')
                    }, 50)
                  }}>

                  <Avatar className="w-9 h-9"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name.slice(0,2)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.role || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* New group dialog */}
      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create a group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Group name</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Production Team" />
            </div>
            <div>
              <Label className="text-xs">Add members</Label>
              <ScrollArea className="h-60 mt-1 border rounded-md p-2">
                <div className="space-y-1">
                  {users.map(u => {
                    const checked = groupMembers.has(u.id)
                    return (
                      <label key={u.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(v) => {
                          setGroupMembers(prev => { const next = new Set(prev); if (v) next.add(u.id); else next.delete(u.id); return next })
                        }} />
                        <Avatar className="w-8 h-8"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name.slice(0,2)}</AvatarFallback></Avatar>
                        <span className="text-sm">{u.name}</span>
                      </label>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroupOpen(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={!groupName.trim() || groupMembers.size === 0}>Create group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {call && myId && (
        <CallDialog
          open={!!call}
          onClose={() => setCall(null)}
          mode={call.mode}
          role={call.role}
          conversationId={call.conversationId}
          myId={myId}
          peer={call.peer}
        />
      )}
    </div>
  )
}

