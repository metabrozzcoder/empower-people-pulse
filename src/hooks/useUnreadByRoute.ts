import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/context/AuthContext'

/**
 * Returns a map of route path -> unread notification count.
 * Matches against `notifications.link` which typically looks like `/#/tasks`.
 */
export function useUnreadByRoute() {
  const { currentUser } = useAuth()
  const [counts, setCounts] = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    if (!currentUser) {
      setCounts({})
      return
    }
    const { data } = await supabase
      .from('notifications')
      .select('link')
      .eq('user_id', currentUser.id)
      .eq('read', false)
      .limit(500)
    const next: Record<string, number> = {}
    for (const row of (data ?? []) as { link: string | null }[]) {
      if (!row.link) continue
      // Normalize `/#/tasks` -> `/tasks`
      const path = row.link.replace(/^\/?#/, '') || '/'
      next[path] = (next[path] ?? 0) + 1
    }
    setCounts(next)
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    load()
    const channel = supabase
      .channel(`notif-counts:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
        () => load()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, load])

  return counts
}
