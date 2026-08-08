/* Import/export helpers for Word (.docx), PowerPoint (.pptx) and PDF files.
   Imported files are converted to HTML so they can be edited collaboratively
   in the workspace editor, and exported back to the original formats. */
import mammoth from 'mammoth'
import JSZip from 'jszip'
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'
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
  return value || '<p></p>'
}

async function pptxToHtml(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const num = (s: string) => parseInt(s.match(/slide(\d+)\.xml/)![1], 10)
      return num(a) - num(b)
    })

  const parts: string[] = []
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.file(slideFiles[i])!.async('string')
    const doc = new DOMParser().parseFromString(xml, 'application/xml')

    // Walk shapes in document order; keep each shape's paragraphs together and
    // preserve line breaks (<a:br/>) inside a paragraph.
    const shapes = Array.from(doc.getElementsByTagName('p:sp'))
    const blocks: { title: boolean; lines: string[] }[] = []
    for (const sp of shapes) {
      const isTitle = Array.from(sp.getElementsByTagName('p:ph')).some((ph) =>
        /title/i.test(ph.getAttribute('type') ?? ''),
      )
      const lines: string[] = []
      for (const p of Array.from(sp.getElementsByTagName('a:p'))) {
        let line = ''
        for (const node of Array.from(p.childNodes)) {
          const name = (node as Element).nodeName
          if (name === 'a:r') line += (node as Element).textContent ?? ''
          else if (name === 'a:br') line += '\n'
          else if (name === 'a:fld') line += (node as Element).textContent ?? ''
        }
        for (const l of line.split('\n')) if (l.trim()) lines.push(l.trim())
      }
      if (lines.length) blocks.push({ title: isTitle, lines })
    }

    const titleBlock = blocks.find((b) => b.title)
    const heading = titleBlock?.lines[0]?.trim()
    const body = blocks
      .filter((b) => b !== titleBlock)
      .map((b) => b.lines)
      .concat(titleBlock ? [titleBlock.lines.slice(1)] : [])
      .flat()

    parts.push(
      `<h2 data-slide="${i + 1}">${esc(heading || `Slide ${i + 1}`)}</h2>` +
        (body.length ? body.map((l) => `<p>${esc(l)}</p>`).join('') : '<p></p>'),
    )
  }
  return parts.join('') || '<p></p>'
}

async function pdfToHtml(file: File): Promise<string> {
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

    // Render the page itself so pictures, charts and layout survive the import.
    let img = ''
    try {
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
      `<h2 data-page="${i}">Page ${i}</h2>` +
        img +
        (paragraphs.length ? paragraphs.map((l) => `<p>${esc(l)}</p>`).join('') : '<p></p>'),
    )
  }
  return parts.join('') || '<p></p>'
}



/** Converts an uploaded .docx/.pptx/.pdf into editable HTML. */
export async function fileToHtml(file: File): Promise<{ title: string; html: string; format: DocFormat }> {
  const format = detectFormat(file)
  if (!format) throw new Error('Unsupported file type. Use .docx, .pptx or .pdf')
  const html =
    format === 'docx' ? await docxToHtml(file)
    : format === 'pptx' ? await pptxToHtml(file)
    : await pdfToHtml(file)
  return { title: file.name.replace(/\.[^.]+$/, ''), html, format }
}

/* ---------------- Export ---------------- */

interface Block { type: 'h1' | 'h2' | 'h3' | 'p' | 'li'; text: string }

function htmlToBlocks(html: string): Block[] {
  const root = document.createElement('div')
  root.innerHTML = html
  const blocks: Block[] = []
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'ul' || tag === 'ol' || tag === 'div' || tag === 'section') {
        walk(child)
        continue
      }
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
  const doc = new Document({
    sections: [
      {
        properties: {
          page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: title, bold: true })] }),
          ...blocks.map((b) =>
            b.type === 'p' || b.type === 'li'
              ? new Paragraph({
                  bullet: b.type === 'li' ? { level: 0 } : undefined,
                  children: [new TextRun({ text: b.text, font: 'Arial', size: 24 })],
                })
              : new Paragraph({
                  heading:
                    b.type === 'h1' ? HeadingLevel.HEADING_1
                    : b.type === 'h2' ? HeadingLevel.HEADING_2
                    : HeadingLevel.HEADING_3,
                  children: [new TextRun({ text: b.text, bold: true, font: 'Arial' })],
                }),
          ),
        ],
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
  const slides: { title: string; body: string[] }[] = []
  let current: { title: string; body: string[] } = { title, body: [] }
  for (const b of blocks) {
    if (b.type === 'h1' || b.type === 'h2') {
      if (current.body.length || current.title !== title) slides.push(current)
      current = { title: b.text, body: [] }
    } else {
      current.body.push(b.text)
    }
  }
  slides.push(current)

  for (const s of slides) {
    const slide = pptx.addSlide()
    slide.background = { color: 'FFFFFF' }
    slide.addText(s.title || title, {
      x: 0.6, y: 0.5, w: 8.8, h: 1, fontSize: 32, bold: true, color: '1E2761', fontFace: 'Arial',
    })
    if (s.body.length) {
      slide.addText(s.body.map((text) => ({ text, options: { bullet: true, breakLine: true } })), {
        x: 0.7, y: 1.7, w: 8.6, h: 3.4, fontSize: 20, color: '36454F', fontFace: 'Arial',
      })
    }
  }
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob
  download(blob, `${title || 'presentation'}.pptx`)
}

export function exportHtmlAsPdf(html: string, title: string) {
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
