import { useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { DOMSerializer } from "@tiptap/pm/model";
import { AvatarSelectorNode } from "./tiptap-extensions/avatar-selector";
import { StoryboardTableNode } from "./tiptap-extensions/storyboard-table";
import { EditorBubbleMenu } from "./editor-bubble-menu";
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

const DEBOUNCE_MS = 500;

function SelectionTracker({ documentId }: { documentId: Id<"documents"> }) {
  const { editor } = useCurrentEditor();
  const saveSelection = useMutation(api.features.selections.saveSelection);
  const dismissActive = useMutation(
    api.features.selections.dismissActiveSelection,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (text: string, html: string, from: number, to: number) => {
      void saveSelection({ documentId, text, html, from, to });
    },
    [saveSelection, documentId],
  );

  const dismiss = useCallback(() => {
    void dismissActive({ documentId });
  }, [dismissActive, documentId]);

  useEffect(() => {
    if (!editor) return;
    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleEditorSelection = () => {
      const { from, to, empty } = editor.state.selection;
      clear();

      if (empty) {
        const active = document.activeElement;
        const inNodeView =
          (active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement) &&
          editor.view.dom.contains(active);
        if (inNodeView) return;

        timerRef.current = setTimeout(dismiss, DEBOUNCE_MS);
        return;
      }

      timerRef.current = setTimeout(() => {
        const text = editor.state.doc.textBetween(from, to, " ");
        if (!text.trim()) return;

        const slice = editor.state.doc.slice(from, to);
        const serializer = DOMSerializer.fromSchema(editor.schema);
        const wrapper = document.createElement("div");
        wrapper.appendChild(serializer.serializeFragment(slice.content));

        save(text, wrapper.innerHTML, from, to);
      }, DEBOUNCE_MS);
    };

    const handleNativeSelection = () => {
      const active = document.activeElement;
      if (
        !(
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement
        )
      )
        return;
      if (!editor.view.dom.contains(active)) return;

      clear();

      const { selectionStart, selectionEnd, value } = active;
      if (
        selectionStart === null ||
        selectionEnd === null ||
        selectionStart === selectionEnd
      ) {
        return;
      }

      const text = value.substring(selectionStart, selectionEnd);
      if (!text.trim()) return;

      timerRef.current = setTimeout(() => {
        save(text, text, selectionStart, selectionEnd);
      }, DEBOUNCE_MS);
    };

    editor.on("selectionUpdate", handleEditorSelection);
    document.addEventListener("selectionchange", handleNativeSelection);

    return () => {
      editor.off("selectionUpdate", handleEditorSelection);
      document.removeEventListener("selectionchange", handleNativeSelection);
      clear();
    };
  }, [editor, save, dismiss]);

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
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            AvatarSelectorNode,
            StoryboardTableNode,
            Placeholder.configure({
              placeholder: "Start typing or ask the AI to help...",
            }),
          ]}
          content={sync.initialContent}
        >
          <PendingContentApplier documentId={documentId} />
          <SelectionTracker documentId={documentId} />
          <EditorBubbleMenu />
        </EditorProvider>
      </div>
    </div>
  );
}
