import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { AvatarSelectorNode } from "./tiptap-extensions/avatar-selector";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";

const EMPTY_DOC = {
  type: "doc" as const,
  content: [{ type: "paragraph" as const }],
};

function PendingContentApplier({ documentId }: { documentId: Id<"documents"> }) {
  const { editor } = useCurrentEditor();
  const doc = useQuery(api.features.chat.getDocument, { documentId });
  const clearPending = useMutation(api.features.chat.clearPendingContent);
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor || !doc?.pendingContent) return;
    if (appliedRef.current === doc.pendingContent) return;

    appliedRef.current = doc.pendingContent;
    editor.commands.setContent(doc.pendingContent);
    void clearPending({ documentId });
  }, [editor, doc?.pendingContent, documentId, clearPending]);

  return null;
}

function DocumentCreator({
  create,
}: {
  create: (content: typeof EMPTY_DOC) => Promise<void>;
}) {
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    void create(EMPTY_DOC);
  }, [create]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

interface DocumentEditorProps {
  documentId: Id<"documents">;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const sync = useTiptapSync(api.prosemirrorSync, documentId);

  if (sync.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sync.initialContent === null) {
    return <DocumentCreator create={sync.create!} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2">
        <span className="text-sm font-medium">Document</span>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none flex-1 overflow-y-auto p-6">
        <EditorProvider
          extensions={[
            StarterKit,
            sync.extension!,
            AvatarSelectorNode,
            Placeholder.configure({
              placeholder: "Start typing or ask the AI to help...",
            }),
          ]}
          content={sync.initialContent}
        >
          <PendingContentApplier documentId={documentId} />
        </EditorProvider>
      </div>
    </div>
  );
}
