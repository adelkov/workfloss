import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Loader2, Archive, RotateCcw, Plus } from "lucide-react"
import { TemplateList } from "./template-editor"
import { useAuth } from "@/lib/auth-context"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

interface Skill {
  _id: Id<"skills">
  name: string
  slug: string
  description: string
  procedure: string
  status: "active" | "archived"
}

export function SkillEditor({
  skill,
  defaultOpen,
}: {
  skill: Skill
  defaultOpen?: boolean
}) {
  const updateSkill = useMutation(api.features.skills.updateSkill)
  const archiveSkill = useMutation(api.features.skills.archiveSkill)
  const restoreSkill = useMutation(api.features.skills.restoreSkill)
  const templates = useQuery(api.features.skillTemplates.listTemplatesBySkill, {
    skillId: skill._id,
  })

  const [open, setOpen] = useState(defaultOpen ?? false)
  const [name, setName] = useState(skill.name)
  const [slug, setSlug] = useState(skill.slug)
  const [description, setDescription] = useState(skill.description)
  const [procedure, setProcedure] = useState(skill.procedure)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const hasChanges =
    name !== skill.name ||
    slug !== skill.slug ||
    description !== skill.description ||
    procedure !== skill.procedure

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSkill({
        skillId: skill._id,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        procedure,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await archiveSkill({ skillId: skill._id })
    } finally {
      setArchiving(false)
    }
  }

  const handleRestore = async () => {
    setArchiving(true)
    try {
      await restoreSkill({ skillId: skill._id })
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-accent/50">
          <div className="flex items-center gap-2 min-w-0">
            {open ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="font-medium text-sm truncate">{skill.name}</span>
            <Badge
              variant={skill.status === "active" ? "default" : "secondary"}
              className="text-xs"
            >
              {skill.status}
            </Badge>
            {templates && templates.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {templates.length} template{templates.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 rounded-lg border border-border bg-background p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`skill-name-${skill._id}`}>Name</Label>
              <Input
                id={`skill-name-${skill._id}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (slug === slugify(skill.name)) {
                    setSlug(slugify(e.target.value))
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`skill-slug-${skill._id}`}>Slug</Label>
              <Input
                id={`skill-slug-${skill._id}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`skill-desc-${skill._id}`}>
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (shown to the LLM as the tool description)
              </span>
            </Label>
            <Input
              id={`skill-desc-${skill._id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write SEO-optimized blog posts following brand guidelines"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`skill-proc-${skill._id}`}>Procedure</Label>
            <Textarea
              id={`skill-proc-${skill._id}`}
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              rows={15}
              className="font-mono text-sm"
              placeholder="Step-by-step procedure the sub-agent should follow..."
            />
          </div>

          <div className="flex items-center justify-between">
            {skill.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={archiving}
                className="text-destructive hover:text-destructive"
              >
                {archiving ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Archive className="mr-1 h-3 w-3" />
                )}
                Archive Skill
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                disabled={archiving}
              >
                {archiving ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-3 w-3" />
                )}
                Restore Skill
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Save Skill
            </Button>
          </div>

          <div className="border-t pt-4">
            {templates === undefined ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TemplateList templates={templates} skillId={skill._id} />
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function SkillCreateForm({
  agentConfigId,
  onCreated,
}: {
  agentConfigId: Id<"agentConfigs">
  onCreated?: (skillId: Id<"skills">) => void
}) {
  const { userId } = useAuth()
  const createSkill = useMutation(api.features.skills.createSkill)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim() || !userId) return
    setCreating(true)
    try {
      const id = await createSkill({
        agentConfigId,
        name: name.trim(),
        slug: slug.trim(),
        description: "",
        procedure: "",
        createdBy: userId,
      })
      setName("")
      setSlug("")
      onCreated?.(id)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Skill Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setSlug(slugify(e.target.value))
            }}
            placeholder="SEO Blog Writer"
            className="h-8 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="h-8 text-sm font-mono"
          />
        </div>
        <Button
          size="sm"
          className="h-8"
          onClick={handleCreate}
          disabled={!name.trim() || !slug.trim() || creating}
        >
          {creating ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3 w-3" />
          )}
          Add Skill
        </Button>
      </div>
    </div>
  )
}
