import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"

const AGENT_TYPES = [
  { value: "freeform", label: "Freeform" },
  { value: "storyboard", label: "Storyboard" },
  { value: "course_outline", label: "Course Outline" },
] as const

const MODEL_OPTIONS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
] as const

interface AgentConfig {
  _id: Id<"agentConfigs">
  name: string
  slug: string
  instructions: string
  model?: string
  maxSteps?: number
  assignedAgentTypes: string[]
}

export function AgentConfigForm({ config }: { config: AgentConfig }) {
  const updateConfig = useMutation(api.features.agentConfigs.updateAgentConfig)

  const [name, setName] = useState(config.name)
  const [slug, setSlug] = useState(config.slug)
  const [instructions, setInstructions] = useState(config.instructions)
  const [model, setModel] = useState(config.model || "gpt-4o")
  const [maxSteps, setMaxSteps] = useState(config.maxSteps ?? 10)
  const [assignedTypes, setAssignedTypes] = useState<string[]>(config.assignedAgentTypes)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(config.name)
    setSlug(config.slug)
    setInstructions(config.instructions)
    setModel(config.model || "gpt-4o")
    setMaxSteps(config.maxSteps ?? 10)
    setAssignedTypes(config.assignedAgentTypes)
  }, [config])

  const allTypesEnabled = assignedTypes.includes("*")

  const toggleAllTypes = (checked: boolean) => {
    setAssignedTypes(checked ? ["*"] : [])
  }

  const toggleType = (type: string, checked: boolean) => {
    if (allTypesEnabled) return
    setAssignedTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type),
    )
  }

  const hasChanges =
    name !== config.name ||
    slug !== config.slug ||
    instructions !== config.instructions ||
    model !== (config.model || "gpt-4o") ||
    maxSteps !== (config.maxSteps ?? 10) ||
    JSON.stringify(assignedTypes.sort()) !==
      JSON.stringify([...config.assignedAgentTypes].sort())

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateConfig({
        configId: config._id,
        name: name.trim(),
        slug: slug.trim(),
        instructions,
        model,
        maxSteps,
        assignedAgentTypes: assignedTypes,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <h3 className="text-lg font-semibold">Configuration</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="config-name">Name</Label>
          <Input
            id="config-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="config-slug">Slug</Label>
          <Input
            id="config-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="config-instructions">Instructions</Label>
        <Textarea
          id="config-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={20}
          className="font-mono text-sm"
          placeholder="System prompt for this sub-agent..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="config-model">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="config-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="config-maxsteps">Max Steps</Label>
          <Input
            id="config-maxsteps"
            type="number"
            min={1}
            max={30}
            value={maxSteps}
            onChange={(e) => setMaxSteps(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Assigned Agent Types</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="type-all" className="font-normal cursor-pointer">
              All Types
            </Label>
            <Switch
              id="type-all"
              checked={allTypesEnabled}
              onCheckedChange={toggleAllTypes}
            />
          </div>
          {AGENT_TYPES.map((type) => (
            <div
              key={type.value}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <Label
                htmlFor={`type-${type.value}`}
                className={`font-normal cursor-pointer ${allTypesEnabled ? "text-muted-foreground" : ""}`}
              >
                {type.label}
              </Label>
              <Switch
                id={`type-${type.value}`}
                checked={allTypesEnabled || assignedTypes.includes(type.value)}
                onCheckedChange={(checked) => toggleType(type.value, checked)}
                disabled={allTypesEnabled}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
