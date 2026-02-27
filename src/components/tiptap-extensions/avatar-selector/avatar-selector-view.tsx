import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { UserCircle, Check } from "lucide-react";

function avatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export function AvatarSelectorView({ node, updateAttributes }: NodeViewProps) {
  const [open, setOpen] = useState(false);
  const avatars = useQuery(api.features.avatars.listAvatars);
  const selectedId = node.attrs.avatarId as string | null;

  const selectedAvatar = avatars?.find((a) => a._id === selectedId);

  return (
    <NodeViewWrapper data-type="avatar-selector" className="my-4 not-prose">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
              "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedAvatar
                ? "border-border bg-card"
                : "border-dashed border-muted-foreground/30 bg-muted/30",
            )}
          >
            {selectedAvatar ? (
              <>
                <img
                  src={avatarUrl(selectedAvatar.style, selectedAvatar.seed)}
                  alt={selectedAvatar.name}
                  className="size-16 rounded-full bg-muted"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {selectedAvatar.name}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedAvatar.style}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <UserCircle className="size-8 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Click to select an avatar
                </span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-80 p-3"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <p className="mb-3 text-sm font-medium">Choose an avatar</p>
          {avatars === undefined ? (
            <div className="flex h-24 items-center justify-center">
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : avatars.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <span className="text-xs text-muted-foreground">
                No avatars available. Run seedAvatars first.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {avatars.map((avatar) => {
                const isSelected = avatar._id === selectedId;
                return (
                  <button
                    key={avatar._id}
                    type="button"
                    title={avatar.name}
                    onClick={() => {
                      updateAttributes({ avatarId: avatar._id });
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
                      className="size-10 rounded-full bg-muted"
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
    </NodeViewWrapper>
  );
}
