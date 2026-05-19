import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getDict } from '@/i18n/autoDict'

/**
 * Translates English UI strings to the active language by walking the DOM.
 * Optimized: batches work in rAF, pauses the observer during writes to avoid
 * feedback loops, and skips nodes whose value already matches the target.
 */
const ATTRS = ['placeholder', 'title', 'aria-label'] as const
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'PATH', 'CANVAS',
])

export function AutoTranslate() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language?.split('-')[0] ?? 'en'
    const dict = getDict(lang)
    let obs: MutationObserver | null = null
    let scheduled = false
    const pending = new Set<Node>()
    let cancelled = false

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement
      if (!parent || SKIP_TAGS.has(parent.tagName)) return
      if (parent.closest('[data-no-translate]')) return
      const raw = node.nodeValue
      if (!raw) return
      const trimmed = raw.trim()
      if (!trimmed) return

      const holder = node as Text & { __i18nOrig?: string }
      const original = holder.__i18nOrig ?? trimmed
      holder.__i18nOrig = original

      const target = dict ? (dict[original] ?? original) : original
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
        const target = dict ? (dict[original] ?? original) : original
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
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let n: Node | null
      while ((n = walker.nextNode())) translateTextNode(n as Text)
      const descendants = el.querySelectorAll('input,textarea,button,[placeholder],[title],[aria-label]')
      descendants.forEach(translateAttrs)
    }

    const flush = () => {
      scheduled = false
      if (cancelled) return
      const nodes = Array.from(pending)
      pending.clear()
      if (!nodes.length) return
      // Pause observer while we mutate to avoid feedback loops
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
      requestAnimationFrame(flush)
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

    // Initial pass
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
