import { OptionPicker, type OptionPickerInput } from "./option-picker";
import { InfoCard, type InfoCardInput } from "./info-card";
import { SuggestionChips, type SuggestionChipsInput } from "./suggestion-chips";

export type WidgetInput = OptionPickerInput | InfoCardInput | SuggestionChipsInput;

interface WidgetEntry {
  component: React.ComponentType<{ input: any; disabled: boolean; onSelect: (label: string) => void }>;
  interactive: boolean;
}

const WIDGET_TOOLS: Record<string, WidgetEntry> = {
  showOptions: { component: OptionPicker, interactive: true },
  showCard: { component: InfoCard as WidgetEntry["component"], interactive: false },
  showSuggestions: { component: SuggestionChips, interactive: true },
};

export function isWidgetTool(toolName: string): boolean {
  return toolName in WIDGET_TOOLS;
}

export function getWidgetEntry(toolName: string): WidgetEntry | undefined {
  return WIDGET_TOOLS[toolName];
}
