import {
  Loader2,
  BrainCircuit,
  Check,
  FileText,
  Pencil,
  Users,
  AlertCircle,
  Wrench,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ToolPartState } from "@/components/message-parts-utils";
import { isWidgetTool, getWidgetEntry } from "@/components/chat-widgets";

interface ToolMeta {
  icon: React.ComponentType<{ className?: string }>;
  pendingLabel: string;
  doneLabel: string;
}

const TOOL_META: Record<string, ToolMeta> = {
  readDocument: {
    icon: FileText,
    pendingLabel: "Reading document\u2026",
    doneLabel: "Read document",
  },
  replaceDocument: {
    icon: Pencil,
    pendingLabel: "Updating document\u2026",
    doneLabel: "Document updated",
  },
  listAvatars: {
    icon: Users,
    pendingLabel: "Listing avatars\u2026",
    doneLabel: "Listed avatars",
  },
  listSceneLayouts: {
    icon: FileText,
    pendingLabel: "Listing scene layouts\u2026",
    doneLabel: "Listed scene layouts",
  },
  proposeMemory: {
    icon: BrainCircuit,
    pendingLabel: "Proposing memory\u2026",
    doneLabel: "Memory proposed",
  },
};

function ToolCallChip({
  toolName,
  state,
  errorText,
}: {
  toolName: string;
  state: ToolPartState;
  errorText?: string;
}) {
  const meta = TOOL_META[toolName];
  const Icon = meta?.icon ?? Wrench;
  const done = state === "output-available";
  const errored = state === "output-error";

  const label = errored
    ? errorText ?? "Error"
    : done
      ? (meta?.doneLabel ?? toolName)
      : (meta?.pendingLabel ?? `${toolName}\u2026`);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
        errored
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-background text-muted-foreground"
      }`}
    >
      {errored ? (
        <AlertCircle className="h-3 w-3 shrink-0" />
      ) : done ? (
        <Icon className="h-3 w-3 shrink-0" />
      ) : (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
      )}
      {label}
      {done && <Check className="h-3 w-3 shrink-0 text-emerald-500" />}
    </span>
  );
}

export interface MessagePartsProps {
  parts: Array<Record<string, unknown>>;
  role?: "user" | "assistant";
  disabled?: boolean;
  onWidgetSelect?: (label: string) => void;
}

export function MessageParts({ parts, role, disabled = false, onWidgetSelect }: MessagePartsProps) {
  const hasWidget = parts.some(
    (p) =>
      typeof p.type === "string" &&
      (p.type as string).startsWith("tool-") &&
      isWidgetTool((p.type as string).slice(5)),
  );

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "text") {
          if (hasWidget) return null;
          const text = part.text as string;
          if (!text) return null;
          if (role === "user") {
            return <span key={i}>{text}</span>;
          }
          return (
            <div key={i} className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          );
        }
        if (typeof part.type === "string" && (part.type as string).startsWith("tool-")) {
          const toolName = (part.type as string).slice(5);
          const state = (part.state as ToolPartState) ?? "input-available";

          if (isWidgetTool(toolName)) {
            const entry = getWidgetEntry(toolName)!;
            const input = part.input as Record<string, unknown> | undefined;
            if (!input || state === "input-streaming") {
              return (
                <Loader2
                  key={`${part.toolCallId ?? i}`}
                  className="h-4 w-4 animate-spin text-muted-foreground"
                />
              );
            }
            const Component = entry.component;
            return (
              <Component
                key={`${part.toolCallId ?? i}`}
                input={input}
                disabled={disabled || !entry.interactive}
                onSelect={onWidgetSelect ?? (() => {})}
              />
            );
          }

          return (
            <ToolCallChip
              key={`${part.toolCallId ?? i}`}
              toolName={toolName}
              state={state}
              errorText={part.errorText as string | undefined}
            />
          );
        }
        return null;
      })}
    </>
  );
}
