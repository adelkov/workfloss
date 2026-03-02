import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Trash2, Check, X, Loader2, Plus } from "lucide-react"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

interface Template {
  _id: Id<"skillTemplates">
  name: string
  slug: string
  description: string
  content: string
  fileType: "template" | "example" | "reference"
}

export function TemplateList({
  templates,
  skillId,
}: {
  templates: Template[]
  skillId: Id<"skills">
}) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Templates</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Template
        </Button>
      </div>

      {templates.length === 0 && !showAdd && (
        <p className="text-xs text-muted-foreground py-2">No templates yet.</p>
      )}

      {templates.map((t) => (
        <TemplateRow key={t._id} template={t} />
      ))}

      {showAdd && (
        <TemplateCreateForm
          skillId={skillId}
          onDone={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

function TemplateRow({ template }: { template: Template }) {
  const updateTemplate = useMutation(api.features.skillTemplates.updateTemplate)
  const deleteTemplate = useMutation(api.features.skillTemplates.deleteTemplate)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(template.name)
  const [slug, setSlug] = useState(template.slug)
  const [description, setDescription] = useState(template.description)
  const [content, setContent] = useState(template.content)
  const [fileType, setFileType] = useState(template.fileType)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTemplate({
        templateId: template._id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        content,
        fileType,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(template.name)
    setSlug(template.slug)
    setDescription(template.description)
    setContent(template.content)
    setFileType(template.fileType)
    setEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteTemplate({ templateId: template._id })
    } finally {
      setDeleting(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm truncate">{template.name}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {template.fileType}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-8 text-sm font-mono" />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={fileType} onValueChange={(v) => setFileType(v as typeof fileType)}>
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="template">template</SelectItem>
              <SelectItem value="example">example</SelectItem>
              <SelectItem value="reference">reference</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="font-mono text-xs" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
          <X className="mr-1 h-3 w-3" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
          Save
        </Button>
      </div>
    </div>
  )
}

function TemplateCreateForm({
  skillId,
  onDone,
}: {
  skillId: Id<"skills">
  onDone: () => void
}) {
  const createTemplate = useMutation(api.features.skillTemplates.createTemplate)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [fileType, setFileType] = useState<"template" | "example" | "reference">("template")
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return
    setSaving(true)
    try {
      await createTemplate({
        skillId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        content,
        fileType,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }}
            placeholder="blog-template"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-8 text-sm font-mono" />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Blog post HTML template" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={fileType} onValueChange={(v) => setFileType(v as typeof fileType)}>
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="template">template</SelectItem>
              <SelectItem value="example">example</SelectItem>
              <SelectItem value="reference">reference</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="font-mono text-xs" placeholder="Template content..." />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleCreate} disabled={!name.trim() || !slug.trim() || saving}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />}
          Create Template
        </Button>
      </div>
    </div>
  )
}
