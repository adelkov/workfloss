import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Archive, RotateCcw, Loader2, Plus } from "lucide-react"
import { AgentConfigForm } from "@/components/admin/agent-config-form"
import { SkillEditor, SkillCreateForm } from "@/components/admin/skill-editor"
import { TemplateList } from "@/components/admin/template-editor"

export function AdminEditorPage() {
  const { configId } = useParams<{ configId: string }>()
  const navigate = useNavigate()

  const config = useQuery(
    api.features.agentConfigs.getAgentConfig,
    configId ? { configId: configId as Id<"agentConfigs"> } : "skip",
  )
  const skills = useQuery(
    api.features.skills.listSkillsByConfig,
    configId ? { agentConfigId: configId as Id<"agentConfigs"> } : "skip",
  )
  const archiveConfig = useMutation(api.features.agentConfigs.archiveAgentConfig)
  const restoreConfig = useMutation(api.features.agentConfigs.restoreAgentConfig)

  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkillId, setNewSkillId] = useState<Id<"skills"> | null>(null)
  const [selectedSkillId, setSelectedSkillId] = useState<Id<"skills"> | null>(null)
  const [archiving, setArchiving] = useState(false)

  const selectedSkill = skills?.find((s) => s._id === selectedSkillId) ?? null
  const templates = useQuery(
    api.features.skillTemplates.listTemplatesBySkill,
    selectedSkillId ? { skillId: selectedSkillId } : "skip",
  )

  if (!configId) {
    navigate("/admin")
    return null
  }

  if (config === undefined || skills === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (config === null) {
    return (
      <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">Agent config not found.</p>
        </div>
      </div>
      </div>
    )
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await archiveConfig({ configId: config._id })
    } finally {
      setArchiving(false)
    }
  }

  const handleRestore = async () => {
    setArchiving(true)
    try {
      await restoreConfig({ configId: config._id })
    } finally {
      setArchiving(false)
    }
  }

  const activeSkills = skills.filter((s) => s.status === "active")
  const archivedSkills = skills.filter((s) => s.status === "archived")

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-4xl p-4 pb-16 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-2xl font-bold tracking-tight">{config.name}</h2>
          <Badge
            variant={config.status === "active" ? "default" : "secondary"}
          >
            {config.status}
          </Badge>
        </div>
        {config.status === "active" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={archiving}
            className="text-destructive hover:text-destructive"
          >
            {archiving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            Archive Agent
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={archiving}
          >
            {archiving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Restore Agent
          </Button>
        )}
      </div>

      <AgentConfigForm config={config} />

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Skills</h3>
            <p className="text-sm text-muted-foreground">
              Each skill becomes a tool the sub-agent can call. Define the procedure it should follow.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddSkill(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </div>

        {activeSkills.length === 0 && !showAddSkill && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No skills yet. Add a skill to give this sub-agent procedures to follow.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowAddSkill(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {activeSkills.map((skill) => (
            <SkillEditor
              key={skill._id}
              skill={skill}
              defaultOpen={skill._id === newSkillId}
              onOpenChange={(open) => {
                if (open) {
                  setSelectedSkillId(skill._id)
                }
              }}
            />
          ))}
        </div>

        {showAddSkill && (
          <SkillCreateForm
            agentConfigId={config._id}
            onCreated={(id) => {
              setShowAddSkill(false)
              setNewSkillId(id)
            }}
          />
        )}

        {archivedSkills.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Archived Skills</span>
            {archivedSkills.map((skill) => (
              <SkillEditor key={skill._id} skill={skill} />
            ))}
          </div>
        )}
      </div>

      {selectedSkill && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Templates</h3>
            <p className="text-sm text-muted-foreground">
              Templates for <span className="font-medium text-foreground">{selectedSkill.name}</span> — reference files the sub-agent can load during execution.
            </p>
          </div>
          {templates === undefined ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TemplateList templates={templates} skillId={selectedSkill._id} />
          )}
        </div>
      )}
    </div>
    </div>
  )
}
