import { Button } from "@/components/ui/button";

export interface SuggestionChipsInput {
  message?: string;
  suggestions: Array<{ label: string }>;
}

interface SuggestionChipsProps {
  input: SuggestionChipsInput;
  disabled: boolean;
  onSelect: (label: string) => void;
}

export function SuggestionChips({ input, disabled, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      {input.message && (
        <p className="text-sm">{input.message}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {input.suggestions.map((s) => (
          <Button
            key={s.label}
            variant="secondary"
            size="sm"
            className="h-auto rounded-full px-3 py-1 text-xs"
            disabled={disabled}
            onClick={() => onSelect(s.label)}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
