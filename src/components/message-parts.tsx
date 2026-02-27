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
import type { ToolPartState } from "@/components/message-parts-utils";

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

export function MessageParts({ parts }: { parts: Array<Record<string, unknown>> }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "text") {
          const text = part.text as string;
          if (!text) return null;
          return <span key={i}>{text}</span>;
        }
        if (typeof part.type === "string" && (part.type as string).startsWith("tool-")) {
          const toolName = (part.type as string).slice(5);
          return (
            <ToolCallChip
              key={`${part.toolCallId ?? i}`}
              toolName={toolName}
              state={(part.state as ToolPartState) ?? "input-available"}
              errorText={part.errorText as string | undefined}
            />
          );
        }
        return null;
      })}
    </>
  );
}
