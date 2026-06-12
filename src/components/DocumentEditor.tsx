import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, degrees } from 'pdf-lib'
import * as fabric from 'fabric'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  MousePointer2, Type, Pencil, Highlighter, Signature, Trash2,
  ChevronLeft, ChevronRight, RotateCw, FileX, Loader2, Eraser, Undo2,
} from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

type Tool = 'select' | 'text' | 'pen' | 'highlight'

interface DocEditorProps {
  file: File
  onSave: (newFile: File) => void
  onCancel: () => void
}

// Per-page fabric JSON overlay store
type Overlays = Record<number, string | undefined>

export function DocumentEditor({ file, onSave, onCancel }: DocEditorProps) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const previewRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const pdfBytesRef = useRef<Uint8Array | null>(null)
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const overlaysRef = useRef<Overlays>({})
  const rotationsRef = useRef<Record<number, number>>({})
  const deletedRef = useRef<Set<number>>(new Set()) // original page indexes (0-based)
  const [pageOrder, setPageOrder] = useState<number[]>([]) // remaining original page indexes
  const [pageIdx, setPageIdx] = useState(0)
  const [tool, setTool] = useState<Tool>('select')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [sigOpen, setSigOpen] = useState(false)
  const [renderTick, setRenderTick] = useState(0)

  // ---------- Initialize ----------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const buf = new Uint8Array(await file.arrayBuffer())
      pdfBytesRef.current = buf
      if (isPdf) {
        const doc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise
        if (cancelled) return
        pdfDocRef.current = doc
        setPageOrder(Array.from({ length: doc.numPages }, (_, i) => i))
      } else {
        setPageOrder([0])
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const currentOriginalPage = pageOrder[pageIdx]

  // ---------- Render current page ----------
  const renderPage = useCallback(async () => {
    if (currentOriginalPage === undefined) return
    const previewCanvas = previewRef.current
    const overlayCanvas = overlayRef.current
    if (!previewCanvas || !overlayCanvas) return

    let width = 800, height = 1000

    if (isPdf && pdfDocRef.current) {
      const page = await pdfDocRef.current.getPage(currentOriginalPage + 1)
      const rotation = rotationsRef.current[currentOriginalPage] ?? 0
      const viewport = page.getViewport({ scale: 1.3, rotation })
      width = viewport.width
      height = viewport.height
      previewCanvas.width = width
      previewCanvas.height = height
      const ctx = previewCanvas.getContext('2d')!
      await page.render({ canvas: previewCanvas, canvasContext: ctx, viewport }).promise
    } else {
      // image
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise<void>((r) => { img.onload = () => r() })
      const maxW = 900
      const scale = Math.min(1, maxW / img.naturalWidth)
      width = img.naturalWidth * scale
      height = img.naturalHeight * scale
      previewCanvas.width = width
      previewCanvas.height = height
      previewCanvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
    }

    // Setup fabric overlay sized to match
    if (fabricRef.current) {
      fabricRef.current.dispose()
      fabricRef.current = null
    }
    overlayCanvas.width = width
    overlayCanvas.height = height
    const fc = new fabric.Canvas(overlayCanvas, {
      width,
      height,
      backgroundColor: 'transparent',
    })
    fabricRef.current = fc

    // Restore overlay for this page
    const saved = overlaysRef.current[currentOriginalPage]
    if (saved) {
      await fc.loadFromJSON(saved)
      fc.renderAll()
    }

    applyTool(tool)
  }, [currentOriginalPage, isPdf, file, tool])

  useEffect(() => {
    if (!loading) renderPage()
    return () => {
      // persist overlay before swap
      if (fabricRef.current && currentOriginalPage !== undefined) {
        overlaysRef.current[currentOriginalPage] = JSON.stringify(fabricRef.current.toJSON())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pageIdx, renderTick])

  // ---------- Tool management ----------
  const applyTool = (t: Tool) => {
    const fc = fabricRef.current
    if (!fc) return
    fc.isDrawingMode = t === 'pen' || t === 'highlight'
    if (fc.isDrawingMode) {
      const brush = new fabric.PencilBrush(fc)
      brush.width = t === 'highlight' ? 18 : 2
      brush.color = t === 'highlight' ? 'rgba(255, 235, 59, 0.45)' : '#1e40af'
      fc.freeDrawingBrush = brush
    }
    fc.selection = t === 'select'
  }
  useEffect(() => { applyTool(tool) }, [tool])

  const persistOverlay = () => {
    if (fabricRef.current && currentOriginalPage !== undefined) {
      overlaysRef.current[currentOriginalPage] = JSON.stringify(fabricRef.current.toJSON())
    }
  }

  // ---------- Toolbar actions ----------
  const addTextBox = () => {
    const fc = fabricRef.current; if (!fc) return
    const text = new fabric.Textbox('Type here…', {
      left: 60, top: 60, width: 200, fontSize: 18, fill: '#111', backgroundColor: 'rgba(255,255,255,0.8)',
      padding: 4, borderColor: '#3b82f6',
    })
    fc.add(text); fc.setActiveObject(text); fc.requestRenderAll()
    setTool('select')
  }

  const deleteSelected = () => {
    const fc = fabricRef.current; if (!fc) return
    fc.getActiveObjects().forEach((o) => fc.remove(o))
    fc.discardActiveObject(); fc.requestRenderAll()
  }

  const clearAnnotations = () => {
    const fc = fabricRef.current; if (!fc) return
    fc.getObjects().slice().forEach((o) => fc.remove(o))
    fc.requestRenderAll()
  }

  const undoLast = () => {
    const fc = fabricRef.current; if (!fc) return
    const objs = fc.getObjects()
    if (objs.length) { fc.remove(objs[objs.length - 1]); fc.requestRenderAll() }
  }

  // ---------- Page operations ----------
  const rotatePage = () => {
    if (!isPdf || currentOriginalPage === undefined) return
    persistOverlay()
    rotationsRef.current[currentOriginalPage] = ((rotationsRef.current[currentOriginalPage] ?? 0) + 90) % 360
    // clear overlay on rotation to avoid mis-aligned annotations
    overlaysRef.current[currentOriginalPage] = undefined
    setRenderTick((t) => t + 1)
  }

  const deletePage = () => {
    if (!isPdf || pageOrder.length <= 1 || currentOriginalPage === undefined) return
    persistOverlay()
    deletedRef.current.add(currentOriginalPage)
    overlaysRef.current[currentOriginalPage] = undefined
    const next = pageOrder.filter((p) => p !== currentOriginalPage)
    setPageOrder(next)
    setPageIdx((i) => Math.min(i, next.length - 1))
  }

  const goPage = (delta: number) => {
    persistOverlay()
    setPageIdx((i) => Math.max(0, Math.min(pageOrder.length - 1, i + delta)))
  }

  // ---------- Signature ----------
  const placeSignature = (dataUrl: string) => {
    const fc = fabricRef.current; if (!fc) return
    fabric.FabricImage.fromURL(dataUrl).then((img) => {
      const scale = Math.min(180 / (img.width ?? 180), 90 / (img.height ?? 90))
      img.set({ left: 80, top: (fc.height ?? 400) - 140, scaleX: scale, scaleY: scale })
      fc.add(img); fc.setActiveObject(img); fc.requestRenderAll()
      setTool('select')
    })
  }

  // ---------- Save: flatten back to file ----------
  const handleSave = async () => {
    persistOverlay()
    setBusy(true)
    try {
      if (isPdf && pdfBytesRef.current) {
        const srcPdf = await PDFDocument.load(pdfBytesRef.current.slice(0))
        const outPdf = await PDFDocument.create()
        for (const origIdx of pageOrder) {
          const [copied] = await outPdf.copyPages(srcPdf, [origIdx])
          const rot = rotationsRef.current[origIdx] ?? 0
          if (rot) {
            const existing = copied.getRotation().angle
            copied.setRotation(degrees((existing + rot) % 360))
          }
          const overlayJson = overlaysRef.current[origIdx]
          if (overlayJson) {
            // Render overlay to PNG at page native size
            const { width: pw, height: ph } = copied.getSize()
            const tmp = document.createElement('canvas')
            const scale = 2
            tmp.width = pw * scale
            tmp.height = ph * scale
            const tmpFc = new fabric.StaticCanvas(tmp, { width: pw * scale, height: ph * scale, backgroundColor: 'transparent' })
            await tmpFc.loadFromJSON(overlayJson)
            // scale objects to PDF size
            const srcW = (previewRef.current?.width ?? pw) || pw
            const scaleX = (pw * scale) / srcW
            tmpFc.getObjects().forEach((o) => {
              o.set({
                left: (o.left ?? 0) * scaleX,
                top: (o.top ?? 0) * scaleX,
                scaleX: (o.scaleX ?? 1) * scaleX,
                scaleY: (o.scaleY ?? 1) * scaleX,
              })
              o.setCoords()
            })
            tmpFc.renderAll()
            const png = tmp.toDataURL('image/png')
            const pngBytes = await fetch(png).then((r) => r.arrayBuffer())
            const embeddedImg = await outPdf.embedPng(pngBytes)
            copied.drawImage(embeddedImg, { x: 0, y: 0, width: pw, height: ph })
            tmpFc.dispose()
          }
          outPdf.addPage(copied)
        }
        const bytes = await outPdf.save()
        const out = new File([new Uint8Array(bytes)], file.name.replace(/\.pdf$/i, '') + '-edited.pdf', { type: 'application/pdf' })
        onSave(out)
      } else {
        // Image: flatten preview + overlay onto one canvas
        const preview = previewRef.current!
        const out = document.createElement('canvas')
        out.width = preview.width; out.height = preview.height
        const ctx = out.getContext('2d')!
        ctx.drawImage(preview, 0, 0)
        if (fabricRef.current) {
          const dataUrl = fabricRef.current.toDataURL({ format: 'png', multiplier: 1 })
          const img = new Image()
          img.src = dataUrl
          await new Promise<void>((r) => { img.onload = () => r() })
          ctx.drawImage(img, 0, 0)
        }
        const blob: Blob = await new Promise((r) => out.toBlob((b) => r(b!), 'image/png'))
        const out2 = new File([blob], file.name.replace(/\.[^.]+$/, '') + '-edited.png', { type: 'image/png' })
        onSave(out2)
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading document…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 p-2">
        <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={MousePointer2} label="Select" />
        <ToolBtn active={false} onClick={addTextBox} icon={Type} label="Add text" />
        <ToolBtn active={tool === 'pen'} onClick={() => setTool('pen')} icon={Pencil} label="Pen" />
        <ToolBtn active={tool === 'highlight'} onClick={() => setTool('highlight')} icon={Highlighter} label="Highlight" />
        <ToolBtn active={false} onClick={() => setSigOpen(true)} icon={Signature} label="Signature" />
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolBtn active={false} onClick={undoLast} icon={Undo2} label="Undo" />
        <ToolBtn active={false} onClick={deleteSelected} icon={Trash2} label="Delete selected" />
        <ToolBtn active={false} onClick={clearAnnotations} icon={Eraser} label="Clear page annotations" />
        {isPdf && (
          <>
            <div className="mx-1 h-6 w-px bg-border" />
            <ToolBtn active={false} onClick={rotatePage} icon={RotateCw} label="Rotate page" />
            <ToolBtn active={false} onClick={deletePage} icon={FileX} label="Delete page" />
            <div className="mx-1 h-6 w-px bg-border" />
            <Button size="sm" variant="ghost" onClick={() => goPage(-1)} disabled={pageIdx === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2 tabular-nums">
              Page {pageIdx + 1} / {pageOrder.length}
            </span>
            <Button size="sm" variant="ghost" onClick={() => goPage(1)} disabled={pageIdx >= pageOrder.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save edited file
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative max-h-[70vh] overflow-auto rounded-md border bg-neutral-200 dark:bg-neutral-900 p-4 flex justify-center">
        <div className="relative inline-block shadow-lg">
          <canvas ref={previewRef} className="block bg-white" />
          <div className="absolute inset-0">
            <canvas ref={overlayRef} />
          </div>
        </div>
      </div>

      <SignaturePad open={sigOpen} onOpenChange={setSigOpen} onConfirm={placeSignature} />
    </div>
  )
}

function ToolBtn({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: typeof Pencil; label: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'secondary' : 'ghost'}
      onClick={onClick}
      title={label}
      className="h-8 gap-1"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline text-xs">{label}</span>
    </Button>
  )
}

// ---------- Signature pad ----------
function SignaturePad({
  open, onOpenChange, onConfirm,
}: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [typed, setTyped] = useState('')
  const drawing = useRef(false)

  useEffect(() => {
    if (!open) return
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round'
  }, [open])

  const start = (e: React.PointerEvent) => {
    drawing.current = true
    const c = canvasRef.current!; const r = c.getBoundingClientRect()
    const ctx = c.getContext('2d')!
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const c = canvasRef.current!; const r = c.getBoundingClientRect()
    const ctx = c.getContext('2d')!
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke()
  }
  const end = () => { drawing.current = false }

  const clear = () => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  }

  const confirm = () => {
    if (mode === 'type') {
      const c = document.createElement('canvas')
      c.width = 500; c.height = 140
      const ctx = c.getContext('2d')!
      ctx.fillStyle = 'rgba(255,255,255,0)'; ctx.clearRect(0, 0, c.width, c.height)
      ctx.fillStyle = '#111'; ctx.font = 'italic 56px "Brush Script MT", cursive'
      ctx.textBaseline = 'middle'
      ctx.fillText(typed || 'Signature', 10, 70)
      onConfirm(c.toDataURL('image/png'))
    } else {
      const c = canvasRef.current!
      onConfirm(c.toDataURL('image/png'))
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add signature</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          <Button size="sm" variant={mode === 'draw' ? 'secondary' : 'ghost'} onClick={() => setMode('draw')}>Draw</Button>
          <Button size="sm" variant={mode === 'type' ? 'secondary' : 'ghost'} onClick={() => setMode('type')}>Type</Button>
        </div>
        {mode === 'draw' ? (
          <div className="space-y-2">
            <canvas
              ref={canvasRef}
              width={460}
              height={160}
              className="w-full rounded-md border bg-white touch-none cursor-crosshair"
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
            />
            <Button size="sm" variant="ghost" onClick={clear}>Clear</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Your name</Label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="John Doe" />
            <div className="rounded-md border bg-white p-4 text-center">
              <span style={{ fontFamily: '"Brush Script MT", cursive', fontSize: 40, fontStyle: 'italic' }}>
                {typed || 'Signature'}
              </span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm}>Place signature</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
