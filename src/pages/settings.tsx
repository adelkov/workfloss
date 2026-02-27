import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrainCircuit, Pencil, Trash2, Check, X, Loader2 } from "lucide-react"

const CATEGORY_LABELS: Record<string, string> = {
  user_fact: "User Fact",
  project: "Project",
  domain: "Domain",
  preference: "Preference",
}

function formatCategory(category: string) {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ")
}

function MemoryRow({
  memory,
}: {
  memory: {
    _id: Id<"semanticMemories">
    content: string
    category: string
  }
}) {
  const updateMemory = useMutation(api.features.memory.updateMemory)
  const deleteMemory = useMutation(api.features.memory.deleteMemory)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(memory.content)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === memory.content) {
      setEditing(false)
      setDraft(memory.content)
      return
    }
    setSaving(true)
    try {
      await updateMemory({ memoryId: memory._id, content: trimmed })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft(memory.content)
    setEditing(false)
  }

  const handleDelete = async () => {
    await deleteMemory({ memoryId: memory._id })
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              disabled={saving}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") handleCancel()
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-sm leading-snug">{memory.content}</p>
        )}
      </div>
      {!editing && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const memories = useQuery(api.features.memory.listConfirmedMemories)

  const grouped = memories
    ? Object.entries(
        memories.reduce<
          Record<string, typeof memories>
        >((acc, m) => {
          const key = m.category
          ;(acc[key] ??= []).push(m)
          return acc
        }, {}),
      ).sort(([a], [b]) => a.localeCompare(b))
    : null

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and application preferences.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">

        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Memories</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage facts the AI remembers about you.
          </p>

          <div className="mt-4">
            {grouped === null ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : grouped.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No memories saved yet. Memories are proposed by the AI during
                conversations.
              </p>
            ) : (
              <div className="space-y-4">
                {grouped.map(([category, items]) => (
                  <div key={category}>
                    <span className="mb-2 inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {formatCategory(category)}
                    </span>
                    <div className="space-y-2">
                      {items.map((memory) => (
                        <MemoryRow key={memory._id} memory={memory} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
