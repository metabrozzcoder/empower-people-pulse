import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft, Plus, Trash2, FileText, Table as TableIcon, KanbanSquare,
  MessageSquare, Loader2, Send, UserPlus, Save, Upload, Download, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { fileToHtml, exportHtmlAsDocx, exportHtmlAsPptx, exportHtmlAsPdf, exportEditedOriginal, renderPdfPreview, extractPptxImages, type DocFormat } from '@/lib/docFormats'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'


/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any

export interface Person { id: string; name: string; avatar_url?: string | null }

interface Props {
  workspaceId: string
  workspaceTitle: string
  ownerId: string
  people: Person[]
  onBack: () => void
}

const BOARD_COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'doing', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

function initials(name?: string) {
  return (name ?? '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function WorkspaceRoom({ workspaceId, workspaceTitle, ownerId, people, onBack }: Props) {
  const { t } = useTranslation()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const uid = currentUser?.id as string | undefined

  const [docs, setDocs] = useState<any[]>([])
  const [sheets, setSheets] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [online, setOnline] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardColumn, setNewCardColumn] = useState('todo')
  const [inviteId, setInviteId] = useState('')
  const [savingDoc, setSavingDoc] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pages, setPages] = useState<{ id: string; label: string }[]>([])
  const [activePage, setActivePage] = useState(0)
  const [preview, setPreview] = useState<{ title: string; html: string; format: DocFormat; images: string[]; withImages: boolean } | null>(null)
  const pendingFile = useRef<File | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)


  const editorRef = useRef<HTMLDivElement>(null)
  const editingRef = useRef(false)
  const lastSavedRef = useRef<string | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const nameById = useMemo(() => {
    const m = new Map<string, Person>()
    people.forEach((p) => m.set(p.id, p))
    return m
  }, [people])

  const load = useCallback(async () => {
    const [d, s, c, cm, mem] = await Promise.all([
      db.from('workspace_docs').select('*').eq('workspace_id', workspaceId).order('created_at'),
      db.from('workspace_sheets').select('*').eq('workspace_id', workspaceId).order('created_at'),
      db.from('workspace_cards').select('*').eq('workspace_id', workspaceId).order('order_index'),
      db.from('workspace_comments').select('*').eq('workspace_id', workspaceId).order('created_at'),
      db.from('workspace_members').select('*').eq('workspace_id', workspaceId),
    ])
    setDocs(d.data ?? [])
    setSheets(s.data ?? [])
    setCards(c.data ?? [])
    setComments(cm.data ?? [])
    setMembers(mem.data ?? [])
    setActiveDocId((prev) => prev ?? (d.data?.[0]?.id ?? null))
    setActiveSheetId((prev) => prev ?? (s.data?.[0]?.id ?? null))
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { setLoading(true); load() }, [load])

  // Realtime sync + presence
  useEffect(() => {
    if (!uid) return
    const channel = supabase.channel(`workspace:${workspaceId}`, { config: { presence: { key: uid } } })
    const tables = ['workspace_docs', 'workspace_sheets', 'workspace_cards', 'workspace_comments', 'workspace_members']
    tables.forEach((table) => {
      channel.on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table, filter: `workspace_id=eq.${workspaceId}` } as never,
        (() => { load() }) as never,
      )
    })
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, unknown[]>
      setOnline(Object.keys(state))
    })
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') channel.track({ at: Date.now() })
    })
    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, uid, load])

  const activeDoc = docs.find((d) => d.id === activeDocId) ?? null
  const activeSheet = sheets.find((s) => s.id === activeSheetId) ?? null

  // Apply remote doc content when not actively typing
  useEffect(() => {
    if (!editorRef.current || !activeDoc) return
    if (editingRef.current) return
    // Ignore the echo of our own save so the caret is never reset mid-edit
    if ((activeDoc.content_html ?? '') === lastSavedRef.current) return
    if (editorRef.current.innerHTML !== (activeDoc.content_html ?? '')) {
      editorRef.current.innerHTML = activeDoc.content_html ?? ''
    }
  }, [activeDoc?.id, activeDoc?.content_html, activeDoc])

  // Detect page / slide sections (from imported PDF & PPTX) for navigation
  const refreshPages = useCallback(() => {
    const el = editorRef.current
    if (!el) return setPages([])
    const heads = Array.from(el.querySelectorAll('h1,h2')) as HTMLElement[]
    const found = heads.map((h, i) => {
      const num = h.getAttribute('data-page') ?? h.getAttribute('data-slide') ?? String(i + 1)
      const kind = h.hasAttribute('data-slide') ? t('workspace.slide', 'Slide') : t('workspace.page', 'Page')
      if (!h.id) h.id = `wsp-sec-${i}`
      h.dataset.sectionIndex = String(i)
      return { id: h.id, label: h.hasAttribute('data-page') || h.hasAttribute('data-slide') ? `${kind} ${num}` : (h.textContent || `${kind} ${i + 1}`).slice(0, 24) }
    })
    setPages(found)
  }, [t])

  useEffect(() => { refreshPages(); setActivePage(0) }, [activeDoc?.id, activeDoc?.content_html, refreshPages])

  const goToPage = (idx: number) => {
    const el = editorRef.current
    const target = el?.querySelector(`#${CSS.escape(pages[idx]?.id ?? '')}`) as HTMLElement | null
    if (!target) return
    setActivePage(idx)
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scheduleDocSave = () => {
    if (!activeDocId) return
    editingRef.current = true
    refreshPages()
    if (idleTimer.current) clearTimeout(idleTimer.current)
    // Stay in "editing" mode for a while after the last keystroke so incoming
    // remote updates can't wipe the caret while the user is still working.
    idleTimer.current = setTimeout(() => { editingRef.current = false }, 4000)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const html = editorRef.current?.innerHTML ?? ''
      lastSavedRef.current = html
      setSavingDoc(true)
      await db.from('workspace_docs').update({ content_html: html, updated_by: uid }).eq('id', activeDocId)
      setSavingDoc(false)
    }, 800)
  }

  const addDoc = async () => {
    const { data, error } = await db.from('workspace_docs')
      .insert({ workspace_id: workspaceId, title: 'Untitled', content_html: '', updated_by: uid })
      .select().single()
    if (error) return toast({ title: error.message, variant: 'destructive' })
    setActiveDocId(data.id)
    load()
  }

  // Build a preview (rendered pages + editable HTML) before importing
  const previewFile = async (file: File, withImages = false) => {
    setImporting(true)
    setPreview(null)
    try {
      pendingFile.current = file
      const { title, html, format } = await fileToHtml(file, { withImages })
      let images: string[] = []
      if (format === 'pdf') images = await renderPdfPreview(file)
      else if (format === 'pptx') images = await extractPptxImages(file)
      setPreview({ title, html, format, images, withImages })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const confirmImport = async () => {
    if (!preview) return
    setImporting(true)
    try {
      // Keep the original file so exports can be a copy of it with the edits applied
      let sourcePath: string | null = null
      const file = pendingFile.current
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? preview.format
        const path = `${workspaceId}/${crypto.randomUUID()}.${ext}`
        const up = await supabase.storage.from('workspace-files').upload(path, file, { upsert: false })
        if (!up.error) sourcePath = path
      }
      const { data, error } = await db.from('workspace_docs')
        .insert({
          workspace_id: workspaceId,
          title: preview.title,
          content_html: preview.html,
          updated_by: uid,
          source_path: sourcePath,
          source_format: preview.format,
        })
        .select().single()
      if (error) throw new Error(error.message)
      editingRef.current = false
      setActiveDocId(data.id)
      await load()
      toast({ title: t('workspace.imported', 'Document imported') as string, description: preview.title })
      setPreview(null)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }


  const doExport = async (format: 'docx' | 'pptx' | 'pdf') => {
    const html = editorRef.current?.innerHTML ?? ''
    const doc = docs.find((d) => d.id === activeDocId)
    const title = (doc?.title as string) || 'document'
    setExporting(true)
    try {
      // If this doc came from an uploaded file, save a NEW copy of that original
      // file with the edits written back into it.
      if (doc?.source_path && doc?.source_format === format) {
        const { data, error } = await supabase.storage.from('workspace-files').download(doc.source_path)
        if (!error && data) {
          await exportEditedOriginal(data, format, html, title)
          return
        }
      }
      if (format === 'docx') await exportHtmlAsDocx(html, title)
      else if (format === 'pptx') await exportHtmlAsPptx(html, title)
      else await exportHtmlAsPdf(html, title)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }



  const addSheet = async () => {
    const { data, error } = await db.from('workspace_sheets')
      .insert({ workspace_id: workspaceId, updated_by: uid }).select().single()
    if (error) return toast({ title: error.message, variant: 'destructive' })
    setActiveSheetId(data.id)
    load()
  }

  const saveSheet = async (id: string, patch: Record<string, unknown>) => {
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    await db.from('workspace_sheets').update({ ...patch, updated_by: uid }).eq('id', id)
  }

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    if (!activeSheet) return
    const rows = (activeSheet.rows ?? []).map((r: string[]) => [...r])
    rows[rowIdx][colIdx] = value
    saveSheet(activeSheet.id, { rows })
  }

  const addCard = async () => {
    if (!newCardTitle.trim()) return
    const { error } = await db.from('workspace_cards').insert({
      workspace_id: workspaceId,
      title: newCardTitle.trim(),
      column_key: newCardColumn,
      order_index: cards.filter((c) => c.column_key === newCardColumn).length,
    })
    if (error) return toast({ title: error.message, variant: 'destructive' })
    setNewCardTitle('')
    load()
  }

  const moveCard = async (id: string, column_key: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, column_key } : c)))
    await db.from('workspace_cards').update({ column_key }).eq('id', id)
  }

  const sendComment = async () => {
    const body = commentBody.trim()
    if (!body || !uid) return
    const mentions = people.filter((p) => body.toLowerCase().includes(`@${p.name.toLowerCase()}`)).map((p) => p.id)
    const { error } = await db.from('workspace_comments').insert({
      workspace_id: workspaceId, user_id: uid, body, mentions,
      target_type: activeDocId ? 'doc' : 'workspace', target_id: activeDocId,
    })
    if (error) return toast({ title: error.message, variant: 'destructive' })
    setCommentBody('')
    load()
  }

  const invite = async () => {
    if (!inviteId) return
    const { error } = await db.from('workspace_members').insert({ workspace_id: workspaceId, user_id: inviteId })
    if (error) return toast({ title: error.message, variant: 'destructive' })
    setInviteId('')
    load()
  }

  const removeMember = async (id: string) => {
    await db.from('workspace_members').delete().eq('id', id)
    load()
  }

  const isOwner = uid === ownerId || members.some((m) => m.user_id === uid && m.role === 'owner')

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {`${t('common.back', 'Back')}`}
        </Button>
        <h2 className="text-xl font-semibold truncate">{workspaceTitle}</h2>
        <div className="flex -space-x-2 ml-auto">
          {[ownerId, ...members.map((m) => m.user_id)].filter((v, i, a) => a.indexOf(v) === i).map((id) => {
            const p = nameById.get(id)
            return (
              <Avatar key={id} className={`h-8 w-8 border-2 ${online.includes(id) ? 'border-emerald-500' : 'border-background'}`}>
                {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                <AvatarFallback className="text-[10px]">{initials(p?.name)}</AvatarFallback>
              </Avatar>
            )
          })}
        </div>
        <Badge variant="secondary">{`${online.length} ${t('workspace.online', 'online')}`}</Badge>
      </div>

      <Tabs defaultValue="docs">
        <TabsList>
          <TabsTrigger value="docs" className="gap-2"><FileText className="h-4 w-4" /> {`${t('workspace.docs', 'Docs')}`}</TabsTrigger>
          <TabsTrigger value="tables" className="gap-2"><TableIcon className="h-4 w-4" /> {`${t('workspace.tables', 'Tables')}`}</TabsTrigger>
          <TabsTrigger value="board" className="gap-2"><KanbanSquare className="h-4 w-4" /> {`${t('workspace.board', 'Board')}`}</TabsTrigger>
          <TabsTrigger value="comments" className="gap-2"><MessageSquare className="h-4 w-4" /> {`${t('workspace.comments', 'Comments')}`}</TabsTrigger>
          <TabsTrigger value="members" className="gap-2"><UserPlus className="h-4 w-4" /> {`${t('workspace.members', 'Members')}`}</TabsTrigger>
        </TabsList>

        {/* DOCS */}
        <TabsContent value="docs" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <Card>
              <CardContent className="p-3 space-y-2">
                <Button size="sm" className="w-full gap-2" onClick={addDoc}>
                  <Plus className="h-4 w-4" /> {`${t('workspace.newDoc', 'New doc')}`}
                </Button>
                <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => importInputRef.current?.click()} disabled={importing}>
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {`${t('workspace.importDoc', 'Import Word / PPTX / PDF')}`}
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".docx,.pptx,.pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) previewFile(f); e.target.value = '' }}
                />
                {docs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { editingRef.current = false; setActiveDocId(d.id) }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${d.id === activeDocId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  >
                    {d.title || 'Untitled'}
                  </button>
                ))}
                {!docs.length && <p className="text-xs text-muted-foreground px-1">{`${t('workspace.noDocs', 'No documents yet.')}`}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                {activeDoc ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={activeDoc.title}
                        onChange={(e) => {
                          const title = e.target.value
                          setDocs((prev) => prev.map((d) => (d.id === activeDoc.id ? { ...d, title } : d)))
                        }}
                        onBlur={(e) => db.from('workspace_docs').update({ title: e.target.value, updated_by: uid }).eq('id', activeDoc.id)}
                        className="font-semibold flex-1 min-w-[160px]"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2" disabled={exporting}>
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            <span className="hidden sm:inline">{`${t('workspace.export', 'Export')}`}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => doExport('docx')}>Word (.docx)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doExport('pptx')}>PowerPoint (.pptx)</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doExport('pdf')}>PDF (.pdf)</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" onClick={async () => {
                        await db.from('workspace_docs').update({ content_html: editorRef.current?.innerHTML ?? '', updated_by: uid }).eq('id', activeDoc.id)
                        editingRef.current = false
                        toast({ title: t('workspace.saved', 'Saved') as string })
                      }} className="gap-2">
                        {savingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>

                      <Button variant="ghost" size="sm" onClick={async () => {
                        await db.from('workspace_docs').delete().eq('id', activeDoc.id)
                        setActiveDocId(null); load()
                      }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>

                    {pages.length > 1 && (
                      <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => goToPage(Math.max(0, activePage - 1))} disabled={activePage === 0}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 overflow-x-auto">
                          <div className="flex gap-1.5 w-max">
                            {pages.map((p, i) => (
                              <button
                                key={p.id}
                                onClick={() => goToPage(i)}
                                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${i === activePage ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => goToPage(Math.min(pages.length - 1, activePage + 1))} disabled={activePage >= pages.length - 1}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{`${activePage + 1} / ${pages.length}`}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/40 p-1.5">
                      {([
                        ['bold', 'B', 'font-bold'],
                        ['italic', 'I', 'italic'],
                        ['underline', 'U', 'underline'],
                      ] as const).map(([cmd, label, cls]) => (
                        <Button key={cmd} type="button" variant="ghost" size="sm" className={`h-7 w-8 p-0 ${cls}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => exec(cmd)}>{label}</Button>
                      ))}
                      <span className="mx-1 h-5 w-px bg-border" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H1')}>H1</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'H2')}>H2</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('formatBlock', 'P')}>P</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>• {`${t('workspace.list', 'List')}`}</Button>
                      <span className="mx-1 h-5 w-px bg-border" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={() => imageInputRef.current?.click()}>
                        <ImagePlus className="h-3.5 w-3.5" /> {`${t('workspace.insertImage', 'Image')}`}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onMouseDown={(e) => e.preventDefault()} onClick={deleteSelectedImage}>
                        <Trash2 className="h-3.5 w-3.5" /> {`${t('workspace.removeImage', 'Remove image')}`}
                      </Button>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onInsertImage} />
                    </div>

                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={scheduleDocSave}
                      onClick={(e) => {
                        const el = e.target as HTMLElement
                        setSelectedImage(el?.tagName === 'IMG' ? (el as HTMLImageElement) : null)
                      }}
                      onBlur={() => { if (idleTimer.current) clearTimeout(idleTimer.current); editingRef.current = false }}
                      className="workspace-doc-editor max-h-[70vh] overflow-y-auto min-h-[320px] rounded-md border bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    <p className="text-xs text-muted-foreground">
                      {`${t('workspace.liveHint', 'Changes save automatically and sync live to everyone in this workspace.')}`}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-12 text-center">{`${t('workspace.selectDoc', 'Select or create a document.')}`}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TABLES */}
        <TabsContent value="tables" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="gap-2" onClick={addSheet}><Plus className="h-4 w-4" /> {`${t('workspace.newTable', 'New table')}`}</Button>
            {sheets.map((s) => (
              <Button key={s.id} size="sm" variant={s.id === activeSheetId ? 'default' : 'outline'} onClick={() => setActiveSheetId(s.id)}>
                {s.title}
              </Button>
            ))}
          </div>
          {activeSheet ? (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={activeSheet.title}
                    onChange={(e) => setSheets((prev) => prev.map((s) => (s.id === activeSheet.id ? { ...s, title: e.target.value } : s)))}
                    onBlur={(e) => saveSheet(activeSheet.id, { title: e.target.value })}
                    className="font-semibold max-w-xs"
                  />
                  <Button size="sm" variant="outline" onClick={() => saveSheet(activeSheet.id, {
                    columns: [...(activeSheet.columns ?? []), `Column ${(activeSheet.columns?.length ?? 0) + 1}`],
                    rows: (activeSheet.rows ?? []).map((r: string[]) => [...r, '']),
                  })}>+ {`${t('workspace.column', 'Column')}`}</Button>
                  <Button size="sm" variant="outline" onClick={() => saveSheet(activeSheet.id, {
                    rows: [...(activeSheet.rows ?? []), (activeSheet.columns ?? []).map(() => '')],
                  })}>+ {`${t('workspace.row', 'Row')}`}</Button>
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={async () => {
                    await db.from('workspace_sheets').delete().eq('id', activeSheet.id)
                    setActiveSheetId(null); load()
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {(activeSheet.columns ?? []).map((c: string, ci: number) => (
                          <th key={ci} className="p-0 border-r last:border-r-0">
                            <input
                              value={c}
                              onChange={(e) => {
                                const columns = [...(activeSheet.columns ?? [])]
                                columns[ci] = e.target.value
                                setSheets((prev) => prev.map((s) => (s.id === activeSheet.id ? { ...s, columns } : s)))
                              }}
                              onBlur={() => saveSheet(activeSheet.id, { columns: activeSheet.columns })}
                              className="w-full bg-transparent px-3 py-2 font-medium text-left focus:outline-none"
                            />
                          </th>
                        ))}
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {(activeSheet.rows ?? []).map((row: string[], ri: number) => (
                        <tr key={ri} className="border-t">
                          {(activeSheet.columns ?? []).map((_: string, ci: number) => (
                            <td key={ci} className="p-0 border-r last:border-r-0">
                              <input
                                value={row[ci] ?? ''}
                                onChange={(e) => updateCell(ri, ci, e.target.value)}
                                className="w-full bg-transparent px-3 py-2 focus:outline-none focus:bg-primary/5"
                              />
                            </td>
                          ))}
                          <td className="text-center">
                            <button onClick={() => saveSheet(activeSheet.id, { rows: (activeSheet.rows ?? []).filter((_: unknown, i: number) => i !== ri) })}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">{`${t('workspace.noTables', 'No shared tables yet.')}`}</p>
          )}
        </TabsContent>

        {/* BOARD */}
        <TabsContent value="board" className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder={t('workspace.cardTitle', 'Card title') as string} className="max-w-xs" />
            <Select value={newCardColumn} onValueChange={setNewCardColumn}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOARD_COLUMNS.map((c) => <SelectItem key={c.key} value={c.key}>{`${t(`workspace.col.${c.key}`, c.label)}`}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-2" onClick={addCard}><Plus className="h-4 w-4" /> {`${t('workspace.addCard', 'Add card')}`}</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {BOARD_COLUMNS.map((col) => (
              <Card key={col.key} className="bg-muted/30">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{`${t(`workspace.col.${col.key}`, col.label)}`}</span>
                    <Badge variant="secondary">{cards.filter((c) => c.column_key === col.key).length}</Badge>
                  </div>
                  {cards.filter((c) => c.column_key === col.key).map((c) => (
                    <div key={c.id} className="rounded-md border bg-background p-2 space-y-2">
                      <div className="flex items-start gap-2">
                        <p className="text-sm flex-1 min-w-0 break-words">{c.title}</p>
                        <button onClick={async () => { await db.from('workspace_cards').delete().eq('id', c.id); load() }}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      <Select value={c.column_key} onValueChange={(v) => moveCard(c.id, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BOARD_COLUMNS.map((x) => <SelectItem key={x.key} value={x.key}>{`${t(`workspace.col.${x.key}`, x.label)}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* COMMENTS */}
        <TabsContent value="comments" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {comments.map((c) => {
                  const p = nameById.get(c.user_id)
                  return (
                    <div key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback className="text-[10px]">{initials(p?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{p?.name ?? '—'}</p>
                        <p className="text-sm break-words whitespace-pre-wrap">{c.body}</p>
                      </div>
                      {(c.user_id === uid || isOwner) && (
                        <button onClick={async () => { await db.from('workspace_comments').delete().eq('id', c.id); load() }}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {!comments.length && <p className="text-sm text-muted-foreground text-center py-6">{`${t('workspace.noComments', 'No comments yet.')}`}</p>}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder={t('workspace.commentPlaceholder', 'Write a comment, use @Name to mention someone') as string}
                  className="min-h-[60px]"
                />
                <Button onClick={sendComment} className="self-end gap-2"><Send className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MEMBERS */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              {isOwner && (
                <div className="flex flex-wrap gap-2">
                  <Select value={inviteId} onValueChange={setInviteId}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder={t('workspace.selectPerson', 'Select a person') as string} />
                    </SelectTrigger>
                    <SelectContent>
                      {people
                        .filter((p) => p.id !== ownerId && !members.some((m) => m.user_id === p.id))
                        .map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={invite} className="gap-2"><UserPlus className="h-4 w-4" /> {`${t('workspace.invite', 'Invite')}`}</Button>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-md border p-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{initials(nameById.get(ownerId)?.name)}</AvatarFallback></Avatar>
                  <span className="text-sm flex-1 truncate">{nameById.get(ownerId)?.name ?? '—'}</span>
                  <Badge>{`${t('workspace.owner', 'Owner')}`}</Badge>
                </div>
                {members.filter((m) => m.user_id !== ownerId).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-md border p-2">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{initials(nameById.get(m.user_id)?.name)}</AvatarFallback></Avatar>
                    <span className="text-sm flex-1 truncate">{nameById.get(m.user_id)?.name ?? '—'}</span>
                    <Badge variant="secondary">{m.role}</Badge>
                    {(isOwner || m.user_id === uid) && (
                      <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import preview */}
      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null) }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {`${t('workspace.previewTitle', 'Preview')}: ${preview?.title ?? ''}`}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1">
              {preview.images.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {preview.images.map((src, i) => (
                    <figure key={i} className="rounded-md border overflow-hidden bg-muted/30">
                      <img src={src} alt={`${preview.title} — ${t('workspace.page', 'Page')} ${i + 1}`} className="w-full" loading="lazy" />
                      <figcaption className="px-2 py-1 text-[11px] text-muted-foreground">
                        {`${preview.format === 'pptx' ? t('workspace.slide', 'Slide') : t('workspace.page', 'Page')} ${i + 1}`}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {`${t('workspace.editableText', 'Editable text that will be imported')}`}
                </p>
                <div
                  className="workspace-doc-editor rounded-md border bg-background p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            {preview?.format === 'pdf' ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={importing}
                onClick={() => { if (pendingFile.current) previewFile(pendingFile.current, !preview.withImages) }}
              >
                {preview.withImages
                  ? `${t('workspace.importTextOnly', 'Import as text only (fully editable)')}`
                  : `${t('workspace.importWithImages', 'Keep original page images')}`}
              </Button>
            ) : <span />}
            <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(null)}>{`${t('common.cancel', 'Cancel')}`}</Button>
            <Button onClick={confirmImport} disabled={importing} className="gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {`${t('workspace.import', 'Import')}`}
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  )
}
