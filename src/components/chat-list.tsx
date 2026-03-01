import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { Plus, MessageSquare, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function ThreadStatusIcon({ status }: { status: Doc<"documents">["agentStatus"] }) {
  switch (status) {
    case "working":
      return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
    default:
      return <MessageSquare className="h-4 w-4 shrink-0" />;
  }
}

interface ChatListProps {
  type: string;
  selectedId: Id<"documents"> | null;
  onSelect: (id: Id<"documents">) => void;
}

export function ChatList({ type, selectedId, onSelect }: ChatListProps) {
  const { userId } = useAuth();
  const chats = useQuery(
    api.features.chat.listChats,
    userId ? { type, userId } : "skip",
  );
  const createChat = useMutation(api.features.chat.createChat);
  const deleteChat = useMutation(api.features.chat.deleteChat);

  const handleNew = async () => {
    if (!userId) return;
    const id = await createChat({ type, userId });
    onSelect(id);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: Id<"documents">,
  ) => {
    e.stopPropagation();
    await deleteChat({ documentId: id });
    if (selectedId === id) onSelect(null as unknown as Id<"documents">);
  };

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Chats</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNew}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats === undefined ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8" />
            <p>No chats yet</p>
            <Button variant="outline" size="sm" onClick={handleNew}>
              Start a chat
            </Button>
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onSelect(chat._id)}
                className={`group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  selectedId === chat._id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <ThreadStatusIcon status={chat.agentStatus} />
                <span className="min-w-0 flex-1 break-words">{chat.title}</span>
                <button
                  onClick={(e) => handleDelete(e, chat._id)}
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
