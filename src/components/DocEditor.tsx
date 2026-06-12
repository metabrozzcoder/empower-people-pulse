import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2,
  Quote, Undo, Redo, Link as LinkIcon, Code,
} from 'lucide-react'
import { useEffect } from 'react'

interface DocEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function DocEditor({ value, onChange, placeholder }: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write your document…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[280px] focus:outline-none p-4',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, Icon: typeof Bold, label: string) => (
    <Button
      type="button"
      size="icon"
      variant={active ? 'secondary' : 'ghost'}
      className="h-8 w-8"
      onClick={onClick}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  return (
    <div className="rounded-md border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), Bold, 'Bold')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), Italic, 'Italic')}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), Strikethrough, 'Strike')}
        {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), Code, 'Code')}
        <div className="mx-1 h-5 w-px bg-border" />
        {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), Heading1, 'H1')}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2, 'H2')}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), List, 'Bullet list')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), ListOrdered, 'Ordered list')}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), Quote, 'Quote')}
        <Button
          type="button"
          size="icon"
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => {
            const prev = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('URL', prev ?? 'https://')
            if (url === null) return
            if (url === '') {
              editor.chain().focus().unsetLink().run()
            } else {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }
          }}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        {btn(false, () => editor.chain().focus().undo().run(), Undo, 'Undo')}
        {btn(false, () => editor.chain().focus().redo().run(), Redo, 'Redo')}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
