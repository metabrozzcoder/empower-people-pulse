import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const LANGS = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  { code: 'uz', label: "O'zbek", short: 'UZ', flag: '🇺🇿' },
] as const

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { session } = useAuth()
  const activeCode = (i18n.language ?? 'en').split('-')[0]
  const current = LANGS.find(l => l.code === activeCode) ?? LANGS[0]

  // Keep <html lang> in sync so the whole document reflects the active language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', current.code)
    }
  }, [current.code])

  const changeLanguage = async (code: string) => {
    if (code === activeCode) return
    await i18n.changeLanguage(code)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', code)
    }
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ preferred_language: code } as never)
        .eq('id', session.user.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label={`Language: ${current.label}`}
          data-no-translate
        >
          <span className="text-base leading-none" aria-hidden>{current.flag}</span>
          <span className="font-semibold tracking-wide">{current.short}</span>
          <span className="hidden md:inline text-muted-foreground">· {current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-no-translate>
        {LANGS.map(lang => {
          const isActive = lang.code === activeCode
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={cn('gap-2', isActive && 'font-semibold')}
            >
              <span className="text-base leading-none" aria-hidden>{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              <span className="text-xs text-muted-foreground">{lang.short}</span>
              {isActive && <Check className="ml-1 h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
