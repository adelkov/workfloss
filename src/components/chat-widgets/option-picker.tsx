import { Button } from "@/components/ui/button";

export interface OptionPickerInput {
  message?: string;
  options: Array<{ id: string; label: string; description?: string }>;
}

interface OptionPickerProps {
  input: OptionPickerInput;
  disabled: boolean;
  onSelect: (label: string) => void;
}

export function OptionPicker({ input, disabled, onSelect }: OptionPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {input.message && (
        <p className="text-sm">{input.message}</p>
      )}
      <div className="flex flex-col gap-1.5">
        {input.options.map((opt) => (
          <Button
            key={opt.id}
            variant="outline"
            size="sm"
            className="h-auto w-full justify-start whitespace-normal py-2 text-left"
            disabled={disabled}
            onClick={() => onSelect(opt.label)}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{opt.label}</span>
              {opt.description && (
                <span className="text-xs text-muted-foreground">
                  {opt.description}
                </span>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
