
# Plan: AI Personal Assistant (Eclaire-inspired) module

Eclaire is MIT-licensed but built on a completely different stack (Next.js + Python workers). We will not port its code. Instead, we'll build a **native equivalent** in your Vite/React + Lovable Cloud stack that captures the spirit: one assistant that can chat over the user's own bookmarks, notes, documents, photos, and tasks.

## What you get

A new sidebar section **"Assistant"** at `/assistant` with:

1. **Capture inbox** — drop a link, note, photo, or document; it's stored and auto-tagged.
2. **Library views** — tabs for Bookmarks, Notes, Documents, Photos (Tasks already exist in the app and will be reused, not duplicated).
3. **AI chat panel** — ask questions like "what did I save about budgeting last week?" — the assistant retrieves your items via tools and answers with citations.

## Backend (Lovable Cloud)

New tables, all RLS-scoped to `auth.uid()`:
- `assistant_items` — unified table: `id, user_id, kind (bookmark|note|document|photo), title, content, url, storage_path, tags[], metadata jsonb, created_at`
- `assistant_threads` — chat threads: `id, user_id, title, created_at`
- `assistant_messages` — `id, thread_id, role, content (UIMessage parts as jsonb), created_at`

Storage: reuse existing `documents` bucket for files; reuse `avatars`-style public bucket pattern for a new `assistant-photos` bucket.

Edge function `assistant-chat`:
- Uses AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview`).
- Tools the model can call:
  - `search_items({ query, kind? })` — text search over the user's `assistant_items`.
  - `get_item({ id })` — fetch full content of one item.
  - `save_bookmark({ url, note? })`, `save_note({ title, content })` — let the assistant capture on the user's behalf.
- Streams responses; persists final assistant message in `onFinish`.

Edge function `enrich-item` (optional v2): on insert, fetches URL metadata / extracts text from uploaded files for better search.

## Frontend

- `src/pages/Assistant.tsx` — split layout: left = library + capture inbox; right = chat panel.
- `src/components/assistant/CaptureBar.tsx` — paste URL / drop file / quick note.
- `src/components/assistant/ItemsLibrary.tsx` — tabs (All / Bookmarks / Notes / Docs / Photos), search, card grid.
- `src/components/assistant/AssistantChat.tsx` — uses `useChat` against the edge function; renders `message.parts` with markdown; shows tool calls compactly; thread list + new-thread button.
- Sidebar entry in `AppSidebar.tsx` with Sparkles-free domain icon (Brain).
- Route `/assistant` added to `App.tsx`, gated by `ProtectedRoute` (sectionName "Assistant").
- i18n keys added in `en/ru/uz.json`.

## Out of scope (for this first pass)

- Eclaire's full self-hosted infrastructure (Postgres+pgvector workers, image embedding pipelines, OCR services, browser-extension capture). We can add semantic search via embeddings in a follow-up.
- Mobile/iOS client.
- Multi-user sharing of items.

## File changes
- New: `supabase/migrations/*_assistant.sql`, `supabase/functions/assistant-chat/index.ts`, `src/pages/Assistant.tsx`, `src/components/assistant/*.tsx`
- Edited: `src/App.tsx`, `src/components/AppSidebar.tsx`, three i18n JSON files, `src/integrations/supabase/types.ts` (auto)
- Attribution: add a note in README crediting Eclaire (MIT) as inspiration.

Confirm and I'll implement starting with the migration.
