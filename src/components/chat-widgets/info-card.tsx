import { Info, CheckCircle2, AlertTriangle } from "lucide-react";

export interface InfoCardInput {
  message?: string;
  title: string;
  body: string;
  variant?: "info" | "success" | "warning";
}

const VARIANT_STYLES: Record<
  string,
  { border: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  info: {
    border: "border-border",
    bg: "bg-card",
    icon: Info,
  },
  success: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    icon: CheckCircle2,
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    icon: AlertTriangle,
  },
};

interface InfoCardProps {
  input: InfoCardInput;
}

export function InfoCard({ input }: InfoCardProps) {
  const v = VARIANT_STYLES[input.variant ?? "info"] ?? VARIANT_STYLES.info;
  const Icon = v.icon;

  return (
    <div className={`rounded-lg border ${v.border} ${v.bg} p-3`}>
      {input.message && (
        <p className="mb-2 text-sm">{input.message}</p>
      )}
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{input.title}</span>
          <span className="text-xs text-muted-foreground">{input.body}</span>
        </div>
      </div>
    </div>
  );
}
