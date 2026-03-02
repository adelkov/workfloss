import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAuth } from "@/lib/auth-context"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Shield, Plus, Bot, Loader2, ChevronRight } from "lucide-react"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function AdminPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const configs = useQuery(api.features.agentConfigs.listAllAgentConfigs)
  const createConfig = useMutation(api.features.agentConfigs.createAgentConfig)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [creating, setCreating] = useState(false)

  const handleNameChange = (name: string) => {
    setNewName(name)
    setNewSlug(slugify(name))
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim() || !userId) return
    setCreating(true)
    try {
      const id = await createConfig({
        name: newName.trim(),
        slug: newSlug.trim(),
        instructions: "",
        assignedAgentTypes: [],
        createdBy: userId,
      })
      setShowCreate(false)
      setNewName("")
      setNewSlug("")
      navigate(`/admin/${id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-4xl p-4 pb-16 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Configs</h2>
          <p className="text-muted-foreground">
            Configure specialized sub-agents with custom skills and procedures.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>
      <Separator />

      {configs === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No agents yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first sub-agent to get started.
          </p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <button
              key={config._id}
              onClick={() => navigate(`/admin/${config._id}`)}
              className="w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{config.name}</span>
                      <Badge
                        variant={config.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {config.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">
                        {config.slug}
                      </span>
                      {config.model && (
                        <span className="text-xs text-muted-foreground">
                          · {config.model}
                        </span>
                      )}
                      {config.assignedAgentTypes.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {config.assignedAgentTypes.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Agent Config</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                placeholder="Marketing Writer"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-slug">Slug</Label>
              <Input
                id="agent-slug"
                placeholder="marketing-writer"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || !newSlug.trim() || creating}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}
