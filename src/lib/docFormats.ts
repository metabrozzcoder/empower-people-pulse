/* Import/export helpers for Word (.docx), PowerPoint (.pptx) and PDF files.
   Imported files are converted to HTML so they can be edited collaboratively
   in the workspace editor, and exported back to the original formats. */
import mammoth from 'mammoth'
import JSZip from 'jszip'
import { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun } from 'docx'
import PptxGenJS from 'pptxgenjs'
import { jsPDF } from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export type DocFormat = 'docx' | 'pptx' | 'pdf'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function detectFormat(file: File): DocFormat | null {
  const n = file.name.toLowerCase()
  if (n.endsWith('.docx')) return 'docx'
  if (n.endsWith('.pptx')) return 'pptx'
  if (n.endsWith('.pdf')) return 'pdf'
  return null
}

/* ---------------- Import ---------------- */

/** Stable hash used to detect which parts of a document the user changed. */
export function textHash(s: string): string {
  const norm = s.replace(/\s+/g, ' ').trim()
  let h = 5381
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/** Tags every text block with the index of the source paragraph it came from,
 *  so edits can be written back into the original file on export. */
function annotateBlocks(html: string): string {
  const root = document.createElement('div')
  root.innerHTML = html
  const blocks = Array.from(root.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,td,th')) as HTMLElement[]
  let i = 0
  for (const b of blocks) {
    if (!(b.textContent ?? '').trim()) continue
    b.setAttribute('data-si', String(i++))
  }
  return root.innerHTML
}

async function docxToHtml(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h3:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        'b => strong',
        'i => em',
        'u => u',
      ],
      includeDefaultStyleMap: true,
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read('base64')
        return { src: `data:${image.contentType};base64,${base64}` }
      }),
    },
  )
  return annotateBlocks(value || '<p></p>')
}


export function pptxSlidePaths(zip: JSZip): string[] {
  return Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const num = (s: string) => parseInt(s.match(/slide(\d+)\.xml/)![1], 10)
      return num(a) - num(b)
    })
}

/** Text of a pptx paragraph (<a:p>), keeping <a:br/> as newlines. */
function pptxParagraphText(p: Element): string {
  let line = ''
  for (const node of Array.from(p.childNodes)) {
    const name = (node as Element).nodeName
    if (name === 'a:r' || name === 'a:fld') line += (node as Element).textContent ?? ''
    else if (name === 'a:br') line += '\n'
  }
  return line
}

async function pptxToHtml(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const slideFiles = pptxSlidePaths(zip)

  const parts: string[] = []
  let si = 0
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.file(slideFiles[i])!.async('string')
    const doc = new DOMParser().parseFromString(xml, 'application/xml')

    // Walk shapes and paragraphs in document order so every block keeps a
    // pointer (data-si) back to the paragraph it came from in the .pptx.
    let html = ''
    let heading = ''
    for (const sp of Array.from(doc.getElementsByTagName('p:sp'))) {
      const isTitle = Array.from(sp.getElementsByTagName('p:ph')).some((ph) =>
        /title/i.test(ph.getAttribute('type') ?? ''),
      )
      for (const p of Array.from(sp.getElementsByTagName('a:p'))) {
        const text = pptxParagraphText(p).replace(/\s+/g, ' ').trim()
        if (!text) continue
        const idx = si++
        if (isTitle && !heading) {
          heading = text
          html = `<h2 data-slide="${i + 1}" data-si="${idx}">${esc(text)}</h2>` + html
        } else {
          html += `<p data-si="${idx}">${esc(text)}</p>`
        }
      }
    }
    if (!heading) html = `<h2 data-slide="${i + 1}">Slide ${i + 1}</h2>` + html
    parts.push(html || `<h2 data-slide="${i + 1}">Slide ${i + 1}</h2><p></p>`)
  }
  return parts.join('') || '<p></p>'

}

async function pdfToHtml(file: File, withImages = false): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const parts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    type Item = { str: string; transform: number[]; width?: number; height?: number; hasEOL?: boolean }
    const items = (content.items as Item[]).filter((it) => typeof it.str === 'string')

    // Group items into visual lines by their baseline (y), then order by x.
    const rows: { y: number; items: Item[] }[] = []
    for (const it of items) {
      if (!it.str) continue
      const y = it.transform?.[5] ?? 0
      const tol = Math.max(2, (it.height ?? 10) * 0.5)
      const row = rows.find((r) => Math.abs(r.y - y) <= tol)
      if (row) row.items.push(it)
      else rows.push({ y, items: [it] })
    }
    rows.sort((a, b) => b.y - a.y)

    const lines = rows
      .map((r) => {
        r.items.sort((a, b) => (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0))
        let text = ''
        let prevEnd: number | null = null
        for (const it of r.items) {
          const x = it.transform?.[4] ?? 0
          const gap = prevEnd === null ? 0 : x - prevEnd
          const space = (it.height ?? 10) * 0.25
          if (prevEnd !== null && gap > space && !/\s$/.test(text) && !/^\s/.test(it.str)) text += ' '
          text += it.str
          prevEnd = x + (it.width ?? 0)
        }
        return text.replace(/\s+/g, ' ').trim()
      })
      .filter(Boolean)

    // Merge wrapped lines into paragraphs: a new paragraph starts after a line
    // that ends a sentence, or on a blank/short line.
    const paragraphs: string[] = []
    for (const line of lines) {
      const prev = paragraphs[paragraphs.length - 1]
      if (prev && !/[.!?:;]$/.test(prev) && /^[a-zа-яёA-ZА-ЯЁ0-9(«"']/.test(line) && prev.length > 40) {
        paragraphs[paragraphs.length - 1] = `${prev} ${line}`
      } else {
        paragraphs.push(line)
      }
    }

    // Pull the real pictures embedded in the page so they stay as editable
    // <img> elements next to the text (instead of flattening the whole page).
    const embedded = await pdfPageImages(page)

    // Optional: a full-page raster for pixel-perfect layout fidelity.
    let img = ''
    if (withImages) try {
      const viewport = page.getViewport({ scale: 1.4 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const ctx = canvas.getContext('2d')!
      await page.render({ canvas, canvasContext: ctx, viewport }).promise
      img = `<p><img src="${canvas.toDataURL('image/jpeg', 0.72)}" alt="Page ${i}" style="max-width:100%" /></p>`
    } catch {
      img = ''
    }

    parts.push(
      `<div class="ws-page-anchor" data-page="${i}" data-oh="${textHash(paragraphs.join(' '))}"></div>` +
        img +
        (paragraphs.length ? paragraphs.map((l) => `<p>${esc(l)}</p>`).join('') : '<p></p>') +
        (withImages ? '' : embedded.map((src) => `<p><img src="${src}" alt="Image" style="max-width:100%" /></p>`).join('')),
    )

  }
  return parts.join('') || '<p></p>'
}

/** Extracts the raster images embedded in a PDF page as data URLs. */
async function pdfPageImages(page: any, max = 8): Promise<string[]> {
  const out: string[] = []
  try {
    const ops = await page.getOperatorList()
    const names: string[] = []
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i]
      if (fn === pdfjsLib.OPS.paintImageXObject || fn === (pdfjsLib.OPS as any).paintJpegXObject) {
        const n = ops.argsArray[i]?.[0]
        if (typeof n === 'string' && !names.includes(n)) names.push(n)
      }
    }
    for (const name of names.slice(0, max)) {
      const obj: any = await new Promise((res) => {
        try {
          const done = (v: unknown) => res(v)
          if (page.objs.has?.(name)) res(page.objs.get(name))
          else page.objs.get(name, done)
        } catch { res(null) }
      })
      const w = obj?.width, h = obj?.height
      if (!obj || !w || !h || w < 48 || h < 48) continue
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      if (obj.bitmap) {
        ctx.drawImage(obj.bitmap, 0, 0)
      } else if (obj.data) {
        const src = obj.data as Uint8ClampedArray
        const comps = Math.round(src.length / (w * h))
        if (comps < 1) continue
        const out2 = ctx.createImageData(w, h)
        for (let p = 0, q = 0; p < w * h; p++) {
          if (comps >= 3) {
            out2.data[q++] = src[p * comps]
            out2.data[q++] = src[p * comps + 1]
            out2.data[q++] = src[p * comps + 2]
            out2.data[q++] = comps === 4 ? src[p * comps + 3] : 255
          } else {
            const v = src[p * comps]
            out2.data[q++] = v; out2.data[q++] = v; out2.data[q++] = v; out2.data[q++] = 255
          }
        }
        ctx.putImageData(out2, 0, 0)
      } else continue
      out.push(canvas.toDataURL('image/jpeg', 0.8))
    }
  } catch { /* images are best-effort */ }
  return out
}



/** Converts an uploaded .docx/.pptx/.pdf into editable HTML. */
export async function fileToHtml(
  file: File,
  opts: { withImages?: boolean } = {},
): Promise<{ title: string; html: string; format: DocFormat }> {
  const format = detectFormat(file)
  if (!format) throw new Error('Unsupported file type. Use .docx, .pptx or .pdf')
  const html =
    format === 'docx' ? await docxToHtml(file)
    : format === 'pptx' ? await pptxToHtml(file)
    : await pdfToHtml(file, opts.withImages === true)
  return { title: file.name.replace(/\.[^.]+$/, ''), html: format === 'pdf' ? annotateBlocks(html) : html, format }
}

/* ---------------- Export ---------------- */

interface Block { type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'img'; text: string; src?: string; w?: number; h?: number }

function htmlToBlocks(html: string): Block[] {
  const root = document.createElement('div')
  root.innerHTML = html
  const blocks: Block[] = []
  const pushImage = (im: Element) => {
    const src = im.getAttribute('src') ?? ''
    if (!src.startsWith('data:image/')) return
    blocks.push({
      type: 'img',
      text: im.getAttribute('alt') ?? '',
      src,
      w: Number(im.getAttribute('width')) || undefined,
      h: Number(im.getAttribute('height')) || undefined,
    })
  }
  const pushImages = (el: Element) => {
    for (const im of Array.from(el.querySelectorAll('img'))) pushImage(im)
  }
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'ul' || tag === 'ol' || tag === 'div' || tag === 'section') {
        walk(child)
        continue
      }
      if (tag === 'img') { pushImage(child); continue }
      if (child.querySelector('img')) pushImages(child)
      const text = (child.textContent ?? '').trim()
      if (!text) continue
      if (tag === 'h1') blocks.push({ type: 'h1', text })
      else if (tag === 'h2') blocks.push({ type: 'h2', text })
      else if (tag === 'h3') blocks.push({ type: 'h3', text })
      else if (tag === 'li') blocks.push({ type: 'li', text })
      else blocks.push({ type: 'p', text })
    }

  }
  walk(root)
  if (!blocks.length) {
    const text = (root.textContent ?? '').trim()
    if (text) blocks.push({ type: 'p', text })
  }
  return blocks
}

function dataUrlType(src: string): 'png' | 'jpg' {
  return src.startsWith('data:image/png') ? 'png' : 'jpg'
}

function dataUrlToBytes(src: string): Uint8Array {
  const b64 = src.split(',')[1] ?? ''
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function loadImageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 600, h: img.naturalHeight || 400 })
    img.onerror = () => resolve({ w: 600, h: 400 })
    img.src = src
  })
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function exportHtmlAsDocx(html: string, title: string) {
  const blocks = htmlToBlocks(html)
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: title, bold: true })] }),
  ]
  for (const b of blocks) {
    if (b.type === 'img' && b.src) {
      const { w, h } = await loadImageSize(b.src)
      const maxW = 600
      const scale = Math.min(1, maxW / w)
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: dataUrlType(b.src) === 'png' ? 'png' : 'jpg',
              data: dataUrlToBytes(b.src),
              transformation: { width: Math.round(w * scale), height: Math.round(h * scale) },
              altText: { title: b.text || 'Image', description: b.text || 'Image', name: b.text || 'Image' },
            }),
          ],
        }),
      )
    } else if (b.type === 'p' || b.type === 'li') {
      children.push(
        new Paragraph({
          bullet: b.type === 'li' ? { level: 0 } : undefined,
          children: [new TextRun({ text: b.text, font: 'Arial', size: 24 })],
        }),
      )
    } else {
      children.push(
        new Paragraph({
          heading:
            b.type === 'h1' ? HeadingLevel.HEADING_1
            : b.type === 'h2' ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3,
          children: [new TextRun({ text: b.text, bold: true, font: 'Arial' })],
        }),
      )
    }
  }
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children,
      },
    ],
  })
  download(await Packer.toBlob(doc), `${title || 'document'}.docx`)
}

export async function exportHtmlAsPptx(html: string, title: string) {
  const blocks = htmlToBlocks(html)
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'

  // Split into slides on headings; everything before the first heading is the title slide body.
  const slides: { title: string; body: string[]; images: string[] }[] = []
  let current = { title, body: [] as string[], images: [] as string[] }
  for (const b of blocks) {
    if (b.type === 'h1' || b.type === 'h2') {
      if (current.body.length || current.images.length || current.title !== title) slides.push(current)
      current = { title: b.text, body: [], images: [] }
    } else if (b.type === 'img' && b.src) {
      current.images.push(b.src)
    } else {
      current.body.push(b.text)
    }
  }
  slides.push(current)

  for (const s of slides) {
    const slide = pptx.addSlide()
    slide.background = { color: 'FFFFFF' }
    slide.addText(s.title || title, {
      x: 0.6, y: 0.4, w: 8.8, h: 0.8, fontSize: 28, bold: true, color: '1E2761', fontFace: 'Arial',
    })
    if (s.images.length) {
      const src = s.images[0]
      const { w, h } = await loadImageSize(src)
      const maxW = 8.6
      const maxH = 3.9
      const ratio = Math.min(maxW / (w / 96), maxH / (h / 96))
      const iw = (w / 96) * ratio
      const ih = (h / 96) * ratio
      slide.addImage({ data: src, x: (10 - iw) / 2, y: 1.3, w: iw, h: ih })
      for (const extra of s.images.slice(1)) {
        const ex = pptx.addSlide()
        ex.background = { color: 'FFFFFF' }
        const size = await loadImageSize(extra)
        const r = Math.min(maxW / (size.w / 96), 4.6 / (size.h / 96))
        ex.addImage({ data: extra, x: (10 - (size.w / 96) * r) / 2, y: 0.5, w: (size.w / 96) * r, h: (size.h / 96) * r })
      }
    } else if (s.body.length) {
      slide.addText(s.body.map((text) => ({ text, options: { bullet: true, breakLine: true } })), {
        x: 0.7, y: 1.5, w: 8.6, h: 3.6, fontSize: 18, color: '36454F', fontFace: 'Arial',
      })
    }
  }
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob
  download(blob, `${title || 'presentation'}.pptx`)
}

export async function exportHtmlAsPdf(html: string, title: string) {
  const blocks = htmlToBlocks(html)
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 56
  const width = pdf.internal.pageSize.getWidth() - margin * 2
  const pageHeight = pdf.internal.pageSize.getHeight()
  let y = margin

  const write = (text: string, size: number, bold: boolean, bullet = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    const lines = pdf.splitTextToSize(bullet ? `• ${text}` : text, width) as string[]
    for (const line of lines) {
      if (y > pageHeight - margin) { pdf.addPage(); y = margin }
      pdf.text(line, margin, y)
      y += size * 1.4
    }
    y += size * 0.5
  }

  write(title || 'Document', 20, true)
  for (const b of blocks) {
    if (b.type === 'img' && b.src) {
      const size = await loadImageSize(b.src)
      const iw = width
      const ih = (size.h / size.w) * iw
      if (y + ih > pageHeight - margin) { pdf.addPage(); y = margin }
      pdf.addImage(b.src, dataUrlType(b.src) === 'png' ? 'PNG' : 'JPEG', margin, y, iw, ih)
      y += ih + 12
      continue
    }
    if (b.type === 'h1') write(b.text, 18, true)
    else if (b.type === 'h2') write(b.text, 16, true)
    else if (b.type === 'h3') write(b.text, 14, true)
    else write(b.text, 11, false, b.type === 'li')
  }
  pdf.save(`${title || 'document'}.pdf`)
}

/* ---------------- Preview ---------------- */

/** Renders the first `maxPages` pages of a PDF to PNG data URLs for previewing. */
export async function renderPdfPreview(file: File, maxPages = 20): Promise<string[]> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const out: string[] = []
  const count = Math.min(pdf.numPages, maxPages)
  for (let i = 1; i <= count; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.1 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')!
    await page.render({ canvas, canvasContext: ctx, viewport }).promise
    out.push(canvas.toDataURL('image/png'))
  }
  return out
}

/** Extracts embedded slide images from a .pptx for a lightweight visual preview. */
export async function extractPptxImages(file: File, maxImages = 20): Promise<string[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const media = Object.keys(zip.files)
    .filter((p) => /^ppt\/media\/.+\.(png|jpe?g|gif|webp)$/i.test(p))
    .sort()
    .slice(0, maxImages)
  const out: string[] = []
  for (const p of media) {
    const base64 = await zip.file(p)!.async('base64')
    const ext = p.split('.').pop()!.toLowerCase()
    const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    out.push(`data:${mime};base64,${base64}`)
  }
  return out
}

/* ---------------- Round-trip export (edit the original file) ----------------
   The original uploaded file is kept, and on export only the edited text is
   written back into a copy of it, so styling, images and layout stay intact. */

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

/** Reads the editor HTML and returns index -> edited text for mapped blocks. */
function editsFromHtml(html: string): { map: Map<number, string>; extra: string[] } {
  const root = document.createElement('div')
  root.innerHTML = html
  const map = new Map<number, string>()
  const extra: string[] = []
  const blocks = Array.from(root.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,td,th')) as HTMLElement[]
  for (const b of blocks) {
    const text = (b.textContent ?? '').replace(/\s+/g, ' ').trim()
    const si = b.getAttribute('data-si')
    if (si !== null) map.set(Number(si), text)
    else if (text) extra.push(text)
  }
  return { map, extra }
}

function setOoxmlText(container: Element, textTag: string, text: string) {
  const ts = Array.from(container.getElementsByTagName(textTag))
  if (!ts.length) return false
  ts[0].textContent = text
  ts[0].setAttribute('xml:space', 'preserve')
  for (let i = 1; i < ts.length; i++) ts[i].textContent = ''
  return true
}

async function exportEditedDocx(source: Blob, html: string, title: string) {
  const zip = await JSZip.loadAsync(await source.arrayBuffer())
  const path = 'word/document.xml'
  const xml = await zip.file(path)!.async('string')
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const { map, extra } = editsFromHtml(html)

  const paras = Array.from(doc.getElementsByTagName('w:p')).filter(
    (p) => (p.textContent ?? '').trim().length > 0,
  )
  paras.forEach((p, i) => {
    if (!map.has(i)) return
    const next = map.get(i)!
    if (next === (p.textContent ?? '').replace(/\s+/g, ' ').trim()) return
    setOoxmlText(p, 'w:t', next)
  })

  // Append blocks the user added that have no counterpart in the original.
  const body = doc.getElementsByTagName('w:body')[0]
  if (body && extra.length) {
    const sectPr = body.getElementsByTagName('w:sectPr')[0] ?? null
    for (const text of extra) {
      const p = doc.createElementNS(W_NS, 'w:p')
      const r = doc.createElementNS(W_NS, 'w:r')
      const t = doc.createElementNS(W_NS, 'w:t')
      t.setAttribute('xml:space', 'preserve')
      t.textContent = text
      r.appendChild(t)
      p.appendChild(r)
      body.insertBefore(p, sectPr)
    }
  }

  zip.file(path, new XMLSerializer().serializeToString(doc))
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  download(blob, `${title || 'document'} (edited).docx`)
}

async function exportEditedPptx(source: Blob, html: string, title: string) {
  const zip = await JSZip.loadAsync(await source.arrayBuffer())
  const { map } = editsFromHtml(html)
  let si = 0
  for (const path of pptxSlidePaths(zip)) {
    const xml = await zip.file(path)!.async('string')
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    let changed = false
    for (const sp of Array.from(doc.getElementsByTagName('p:sp'))) {
      for (const p of Array.from(sp.getElementsByTagName('a:p'))) {
        const current = pptxParagraphText(p).replace(/\s+/g, ' ').trim()
        if (!current) continue
        const idx = si++
        const next = map.get(idx)
        if (next === undefined || next === current) continue
        const runs = Array.from(p.getElementsByTagName('a:r'))
        if (!runs.length) continue
        setOoxmlText(runs[0], 'a:t', next)
        for (let i = 1; i < runs.length; i++) setOoxmlText(runs[i], 'a:t', '')
        changed = true
      }
    }
    if (changed) zip.file(path, new XMLSerializer().serializeToString(doc))
  }
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
  download(blob, `${title || 'presentation'} (edited).pptx`)
}

/** Draws edited page text onto a white canvas the size of the original page. */
function renderTextPage(width: number, height: number, lines: string[]): string {
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil(height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#111111'
  const fs = 13 * scale
  ctx.font = `${fs}px Helvetica, Arial, sans-serif`
  ctx.textBaseline = 'top'
  const margin = 48 * scale
  const maxW = canvas.width - margin * 2
  let y = margin
  for (const line of lines) {
    const words = line.split(' ')
    let buf = ''
    for (const w of words) {
      const test = buf ? `${buf} ${w}` : w
      if (ctx.measureText(test).width > maxW && buf) {
        if (y < canvas.height - margin) ctx.fillText(buf, margin, y)
        y += fs * 1.45
        buf = w
      } else buf = test
    }
    if (buf && y < canvas.height - margin) ctx.fillText(buf, margin, y)
    y += fs * 1.9
  }
  return canvas.toDataURL('image/png')
}

async function exportEditedPdf(source: Blob, html: string, title: string) {
  const { PDFDocument } = await import('pdf-lib')
  const original = await PDFDocument.load(await source.arrayBuffer())
  const out = await PDFDocument.create()

  // Split the editor content into page sections (as created on import).
  const root = document.createElement('div')
  root.innerHTML = html
  const sections: { page: number; hash: string | null; lines: string[] }[] = []
  for (const el of Array.from(root.children) as HTMLElement[]) {
    if (/^H[12]$/.test(el.tagName) && el.hasAttribute('data-page')) {
      sections.push({
        page: Number(el.getAttribute('data-page')),
        hash: el.getAttribute('data-oh'),
        lines: [],
      })
      continue
    }
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (text && sections.length) sections[sections.length - 1].lines.push(text)
  }

  const total = original.getPageCount()
  for (let i = 0; i < total; i++) {
    const section = sections.find((s) => s.page === i + 1)
    const edited = section && section.hash && textHash(section.lines.join(' ')) !== section.hash
    if (!edited) {
      const [copied] = await out.copyPages(original, [i])
      out.addPage(copied)
      continue
    }
    const src = original.getPage(i)
    const { width, height } = src.getSize()
    const png = await out.embedPng(renderTextPage(width, height, section!.lines))
    const page = out.addPage([width, height])
    page.drawImage(png, { x: 0, y: 0, width, height })
  }

  const bytes = await out.save()
  download(new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }), `${title || 'document'} (edited).pdf`)
}

/** Exports a NEW file that is the original uploaded document with the edits applied. */
export async function exportEditedOriginal(
  source: Blob,
  format: DocFormat,
  html: string,
  title: string,
) {
  if (format === 'docx') return exportEditedDocx(source, html, title)
  if (format === 'pptx') return exportEditedPptx(source, html, title)
  return exportEditedPdf(source, html, title)
}
