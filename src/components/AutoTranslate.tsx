import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getDict } from '@/i18n/autoDict'

/**
 * Walks the DOM and translates any English text node / placeholder / title / aria-label
 * whose trimmed text matches a key in the active language dictionary.
 *
 * Runs on every i18n language change and observes DOM mutations so dynamically rendered
 * content (dialogs, dropdowns, table rows) also gets translated.
 *
 * Stores original English in a data attribute so language switching is reversible.
 */
const ATTRS = ['placeholder', 'title', 'aria-label'] as const
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'])

export function AutoTranslate() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language?.split('-')[0] ?? 'en'
    const dict = getDict(lang)

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement
      if (!parent || SKIP_TAGS.has(parent.tagName)) return
      if (parent.closest('[data-no-translate]')) return
      const raw = node.nodeValue
      if (!raw) return
      const trimmed = raw.trim()
      if (!trimmed) return

      // Restore original if we have one
      const original = (node as Text & { __i18nOrig?: string }).__i18nOrig ?? trimmed
      ;(node as Text & { __i18nOrig?: string }).__i18nOrig = original

      if (!dict) {
        if (raw !== original) node.nodeValue = raw.replace(trimmed, original)
        return
      }
      const translated = dict[original]
      if (translated && translated !== trimmed) {
        node.nodeValue = raw.replace(trimmed, translated)
      } else if (!translated && raw !== original) {
        // No mapping in this language → fall back to original English
        node.nodeValue = raw.replace(trimmed, original)
      }
    }

    const translateAttrs = (el: Element) => {
      for (const attr of ATTRS) {
        const val = el.getAttribute(attr)
        if (!val) continue
        const key = `__i18nOrig_${attr}`
        const elx = el as Element & Record<string, string | undefined>
        const original = elx[key] ?? val.trim()
        elx[key] = original
        if (!dict) {
          if (val.trim() !== original) el.setAttribute(attr, original)
          continue
        }
        const t = dict[original]
        if (t && t !== val) el.setAttribute(attr, t)
        else if (!t && val.trim() !== original) el.setAttribute(attr, original)
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
      el.querySelectorAll('*').forEach(translateAttrs)
    }

    walk(document.body)

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => walk(n))
        } else if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(m.target as Text)
        } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
          translateAttrs(m.target as Element)
        }
      }
    })
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    })

    return () => obs.disconnect()
  }, [i18n.language])

  return null
}
