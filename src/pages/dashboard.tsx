import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ChatList } from "@/components/chat-list";
import { ChatWindow } from "@/components/chat-window";
import { DocumentEditor } from "@/components/document-editor";
import { FileText } from "lucide-react";

export function DashboardPage() {
  const [selectedId, setSelectedId] = useState<Id<"documents"> | null>(null);
  const doc = useQuery(
    api.features.chat.getDocument,
    selectedId ? { documentId: selectedId } : "skip",
  );

  return (
    <div className="flex h-full">
      <div className="w-56 shrink-0">
        <ChatList selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {selectedId && doc ? (
        <>
          <div className="w-[350px] shrink-0">
            <ChatWindow documentId={selectedId} threadId={doc.threadId} />
          </div>
          <div className="min-w-0 flex-1">
            <DocumentEditor key={selectedId} documentId={selectedId} />
          </div>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileText className="h-12 w-12" />
          <p className="text-lg font-medium">No document selected</p>
          <p className="text-sm">
            Create a new chat or select an existing one to start editing.
          </p>
        </div>
      )}
    </div>
  );
}
