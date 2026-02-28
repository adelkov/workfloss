export type ToolPartState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "output-error";

export function isRenderable(part: Record<string, unknown>): boolean {
  const type = part.type as string | undefined;
  return type === "text" || (typeof type === "string" && type.startsWith("tool-"));
}

export { isWidgetTool } from "@/components/chat-widgets";
