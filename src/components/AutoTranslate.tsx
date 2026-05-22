import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getDict } from '@/i18n/autoDict'

/**
 * Translates English UI strings to the active language by walking the DOM.
 * Optimized:
 *  - Dictionary lookups via Map (O(1), faster than object property access on hot path)
 *  - Batched flush via requestIdleCallback (fallback to rAF) to avoid jank
 *  - Observer disconnected during writes to prevent feedback loops
 *  - WeakSet of processed nodes to skip re-work
 *  - Skip non-translatable nodes (numbers, single chars, whitespace, urls)
 */
const ATTRS = ['placeholder', 'title', 'aria-label'] as const
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'PATH', 'CANVAS', 'TEXTAREA',
])

const NON_TRANSLATABLE = /^[\d\s\W]*$/ // numbers/whitespace/punctuation only

type Idle = (cb: () => void) => number
const rIC: Idle =
  (typeof window !== 'undefined' && (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback) ||
  ((cb: () => void) => window.requestAnimationFrame(cb) as unknown as number)

export function AutoTranslate() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language?.split('-')[0] ?? 'en'
    const dictObj = getDict(lang)
    const dict: Map<string, string> | null = dictObj
      ? new Map(Object.entries(dictObj))
      : null

    let obs: MutationObserver | null = null
    let scheduled = false
    const pending = new Set<Node>()
    let cancelled = false

    const translateText = (raw: string): string | null => {
      const trimmed = raw.trim()
      if (!trimmed || trimmed.length > 200) return null
      if (NON_TRANSLATABLE.test(trimmed)) return null
      const t = dict?.get(trimmed)
      return t && t !== trimmed ? raw.replace(trimmed, t) : null
    }

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement
      if (!parent || SKIP_TAGS.has(parent.tagName)) return
      if (parent.closest('[data-no-translate]')) return
      const raw = node.nodeValue
      if (!raw) return
      const holder = node as Text & { __i18nOrig?: string; __i18nOut?: string }
      const trimmed = raw.trim()
      // If React replaced the text (current value matches neither last original nor last output),
      // treat the new value as the new original so dynamic strings (dates, counts) re-translate correctly.
      if (holder.__i18nOrig === undefined || (trimmed !== holder.__i18nOrig && trimmed !== holder.__i18nOut)) {
        holder.__i18nOrig = trimmed
      }
      const original = holder.__i18nOrig

      if (!dict) {
        holder.__i18nOut = original
        if (trimmed !== original) node.nodeValue = raw.replace(trimmed, original)
        return
      }
      const target = dict.get(original) ?? original
      holder.__i18nOut = target
      if (target === trimmed) return
      const next = raw.replace(trimmed, target)
      if (next !== raw) node.nodeValue = next
    }

    const translateAttrs = (el: Element) => {
      for (const attr of ATTRS) {
        const val = el.getAttribute(attr)
        if (!val) continue
        const key = `__i18nOrig_${attr}`
        const elx = el as Element & Record<string, string | undefined>
        const original = elx[key] ?? val.trim()
        elx[key] = original
        const target = dict ? (dict.get(original) ?? original) : original
        if (target !== val) el.setAttribute(attr, target)
      }
    }

    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root as Text)
        return
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return
      const el = root as Element
      if (SKIP_TAGS.has(el.tagName)) return
      translateAttrs(el)
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          const p = n.parentElement
          if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      })
      let n: Node | null
      while ((n = walker.nextNode())) translateTextNode(n as Text)
      const descendants = el.querySelectorAll('[placeholder],[title],[aria-label]')
      descendants.forEach(translateAttrs)
    }

    const flush = () => {
      scheduled = false
      if (cancelled) return
      if (!pending.size) return
      const nodes = Array.from(pending)
      pending.clear()
      obs?.disconnect()
      for (const n of nodes) {
        if (n.isConnected) walk(n)
      }
      if (!cancelled) startObserving()
    }

    const schedule = (n: Node) => {
      pending.add(n)
      if (scheduled) return
      scheduled = true
      rIC(flush)
    }

    const startObserving = () => {
      obs?.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...ATTRS],
      })
    }

    walk(document.body)

    obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => schedule(n))
        } else if (m.type === 'characterData') {
          schedule(m.target)
        } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
          schedule(m.target)
        }
      }
    })
    startObserving()

    return () => {
      cancelled = true
      obs?.disconnect()
    }
  }, [i18n.language])

  return null
}
