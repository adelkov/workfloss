import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

interface PMNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: { type: string }[];
}

function pmJsonToText(node: PMNode): string {
  if (node.type === "text") return node.text ?? "";

  const childText = (node.content ?? []).map(pmJsonToText).join("");

  switch (node.type) {
    case "heading":
      return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${childText}\n\n`;
    case "paragraph":
      return `${childText}\n\n`;
    case "bulletList":
    case "orderedList":
      return `${childText}\n`;
    case "listItem":
      return `- ${childText.trim()}\n`;
    case "blockquote":
      return childText
        .split("\n")
        .map((l) => (l ? `> ${l}` : ""))
        .join("\n") + "\n";
    case "codeBlock":
      return `\`\`\`\n${childText}\n\`\`\`\n\n`;
    case "avatarSelector":
      return `[Avatar: ${node.attrs?.avatarId ?? "none selected"}]\n\n`;
    case "horizontalRule":
      return "---\n\n";
    case "hardBreak":
      return "\n";
    default:
      return childText;
  }
}

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi<DataModel>({
  async onSnapshot(ctx, id, snapshot) {
    const parsed: PMNode = JSON.parse(snapshot);
    const text = pmJsonToText(parsed).trim();

    const docId = id as unknown as Id<"documents">;
    const doc = await ctx.db.get(docId);
    if (doc) {
      await ctx.db.patch(docId, { documentContent: text });
    }
  },
});

export { prosemirrorSync };
