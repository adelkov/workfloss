import { useState, useCallback } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  UserCircle,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  Layout,
} from "lucide-react";

interface Scene {
  id: string;
  name: string;
  script: string;
  avatarId: string;
  sceneLayoutId: string;
}

function avatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function AvatarCell({
  avatarId,
  onSelect,
}: {
  avatarId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const avatars = useQuery(api.features.avatars.listAvatars);
  const selected = avatars?.find((a) => a._id === avatarId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors w-full",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected
              ? "border-border bg-card"
              : "border-dashed border-muted-foreground/30 bg-muted/30",
          )}
        >
          {selected ? (
            <>
              <img
                src={avatarUrl(selected.style, selected.seed)}
                alt={selected.name}
                className="size-7 rounded-full bg-muted shrink-0"
              />
              <span className="text-xs font-medium truncate">
                {selected.name}
              </span>
            </>
          ) : (
            <>
              <UserCircle className="size-7 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Select</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="mb-3 text-sm font-medium">Choose an avatar</p>
        {avatars === undefined ? (
          <div className="flex h-20 items-center justify-center">
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        ) : avatars.length === 0 ? (
          <div className="flex h-20 items-center justify-center">
            <span className="text-xs text-muted-foreground">
              No avatars available.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {avatars.map((avatar) => {
              const isSelected = avatar._id === avatarId;
              return (
                <button
                  key={avatar._id}
                  type="button"
                  title={avatar.name}
                  onClick={() => {
                    onSelect(avatar._id);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex items-center justify-center rounded-lg p-1.5 transition-all",
                    "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected && "ring-2 ring-primary bg-primary/10",
                  )}
                >
                  <img
                    src={avatarUrl(avatar.style, avatar.seed)}
                    alt={avatar.name}
                    className="size-9 rounded-full bg-muted"
                  />
                  {isSelected && (
                    <div className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary">
                      <Check className="size-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SceneLayoutCell({
  sceneLayoutId,
  onSelect,
}: {
  sceneLayoutId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const layouts = useQuery(api.features.sceneLayouts.listSceneLayouts);
  const selected = layouts?.find((l) => l._id === sceneLayoutId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left transition-colors w-full",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected
              ? "border-border bg-card"
              : "border-dashed border-muted-foreground/30 bg-muted/30",
          )}
        >
          <Layout className="size-4 text-muted-foreground shrink-0" />
          <span
            className={cn(
              "text-xs truncate",
              selected ? "font-medium" : "text-muted-foreground",
            )}
          >
            {selected?.name ?? "Select layout"}
          </span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {layouts === undefined ? (
          <div className="flex h-16 items-center justify-center">
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        ) : layouts.length === 0 ? (
          <div className="flex h-16 items-center justify-center">
            <span className="text-xs text-muted-foreground">
              No layouts available.
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            {layouts.map((layout) => {
              const isSelected = layout._id === sceneLayoutId;
              return (
                <button
                  key={layout._id}
                  type="button"
                  onClick={() => {
                    onSelect(layout._id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                    "hover:bg-accent focus-visible:outline-none",
                    isSelected && "bg-accent",
                  )}
                >
                  <span className="flex-1 truncate">{layout.name}</span>
                  {isSelected && (
                    <Check className="size-3.5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function StoryboardTableView({
  node,
  updateAttributes,
}: NodeViewProps) {
  const parseScenes = useCallback((): Scene[] => {
    try {
      const raw = node.attrs.scenes as string;
      return JSON.parse(raw) as Scene[];
    } catch {
      return [];
    }
  }, [node.attrs.scenes]);

  const scenes = parseScenes();

  const updateScenes = useCallback(
    (updater: (prev: Scene[]) => Scene[]) => {
      const next = updater(parseScenes());
      updateAttributes({ scenes: JSON.stringify(next) });
    },
    [parseScenes, updateAttributes],
  );

  const updateScene = useCallback(
    (sceneId: string, patch: Partial<Scene>) => {
      updateScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
      );
    },
    [updateScenes],
  );

  const addScene = useCallback(() => {
    updateScenes((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        script: "",
        avatarId: "",
        sceneLayoutId: "",
      },
    ]);
  }, [updateScenes]);

  const removeScene = useCallback(
    (sceneId: string) => {
      updateScenes((prev) => prev.filter((s) => s.id !== sceneId));
    },
    [updateScenes],
  );

  return (
    <NodeViewWrapper data-type="storyboard-table" className="my-4 not-prose">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                #
              </th>
              <th className="w-36 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Script
              </th>
              <th className="w-36 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Avatar
              </th>
              <th className="w-40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Scene Type
              </th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {scenes.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground text-xs"
                >
                  No scenes yet. Click "Add scene" to get started.
                </td>
              </tr>
            ) : (
              scenes.map((scene, idx) => (
                <tr
                  key={scene.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground font-mono tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={scene.name}
                      onChange={(e) =>
                        updateScene(scene.id, { name: e.target.value })
                      }
                      placeholder="Scene name"
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm transition-colors placeholder:text-muted-foreground/50 hover:border-border focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label={`Scene ${idx + 1} name`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <textarea
                      value={scene.script}
                      onChange={(e) =>
                        updateScene(scene.id, { script: e.target.value })
                      }
                      placeholder="Script / narration..."
                      rows={2}
                      className="w-full resize-none rounded-md border border-transparent bg-transparent px-2 py-1 text-sm transition-colors placeholder:text-muted-foreground/50 hover:border-border focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label={`Scene ${idx + 1} script`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AvatarCell
                      avatarId={scene.avatarId}
                      onSelect={(id) =>
                        updateScene(scene.id, { avatarId: id })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SceneLayoutCell
                      sceneLayoutId={scene.sceneLayoutId}
                      onSelect={(id) =>
                        updateScene(scene.id, { sceneLayoutId: id })
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeScene(scene.id)}
                      aria-label={`Remove scene ${idx + 1}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center border-t bg-muted/30 px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={addScene}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <Plus className="size-3.5" />
            Add scene
          </Button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
