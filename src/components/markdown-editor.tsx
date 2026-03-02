import { useEffect, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Markdown, type MarkdownStorage } from "tiptap-markdown"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Minus,
  Undo,
  Redo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface MarkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write markdown...",
  className,
  minHeight = "320px",
}: MarkdownEditorProps) {
  const suppressUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      if (suppressUpdate.current) return
      const md = (e.storage as unknown as Record<string, MarkdownStorage>).markdown.getMarkdown()
      onChange(md)
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const current = (editor.storage as unknown as Record<string, MarkdownStorage>).markdown.getMarkdown()
    if (current === value) return
    suppressUpdate.current = true
    editor.commands.setContent(value)
    suppressUpdate.current = false
  }, [editor, value])

  if (!editor) return null

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none px-4 py-3 focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap.ProseMirror]:min-h-(--editor-min-h)"
        style={{ "--editor-min-h": minHeight } as React.CSSProperties}
      />
    </div>
  )
}

function TBtn({
  icon: Icon,
  label,
  action,
  active,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  action: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      title={label}
      disabled={disabled}
      data-active={active || undefined}
      className="data-active:bg-accent"
      onMouseDown={(e) => {
        e.preventDefault()
        action()
      }}
    >
      <Icon className="size-3.5" />
    </Button>
  )
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
      <TBtn icon={Bold} label="Bold" action={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
      <TBtn icon={Italic} label="Italic" action={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
      <TBtn icon={Strikethrough} label="Strikethrough" action={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} />
      <TBtn icon={Code} label="Inline Code" action={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} />

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <TBtn icon={Heading1} label="Heading 1" action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} />
      <TBtn icon={Heading2} label="Heading 2" action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} />
      <TBtn icon={Heading3} label="Heading 3" action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} />

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <TBtn icon={List} label="Bullet List" action={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} />
      <TBtn icon={ListOrdered} label="Ordered List" action={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} />
      <TBtn icon={Quote} label="Blockquote" action={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} />
      <TBtn icon={CodeSquare} label="Code Block" action={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} />
      <TBtn icon={Minus} label="Horizontal Rule" action={() => editor.chain().focus().setHorizontalRule().run()} />

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <TBtn icon={Undo} label="Undo" action={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
      <TBtn icon={Redo} label="Redo" action={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
    </div>
  )
}
