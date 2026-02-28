"use node";

import { createTool } from "@convex-dev/agent";
import type { ContextHandler } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const readDocument = createTool({
  description:
    "Read the current document content. Always call this before making edits so you see the latest state, including any manual changes by the user.",
  args: z.object({}),
  handler: async (ctx): Promise<string> => {
    const threadId = ctx.threadId;
    if (!threadId) throw new Error("No thread context");

    const content: string | null = await ctx.runQuery(
      internal.features.chat.getDocumentContentByThread,
      { threadId },
    );
    return content || "(empty document)";
  },
});

export const replaceDocument = createTool({
  description:
    "Replace the entire document content with new HTML. Use when the user asks to write, create, edit, or modify the document. Always call readDocument first.",
  args: z.object({
    html: z
      .string()
      .describe("The full HTML content for the document body"),
  }),
  handler: async (ctx, args) => {
    const threadId = ctx.threadId;
    if (!threadId) throw new Error("No thread context");

    await ctx.runMutation(
      internal.features.chat.setPendingContent,
      { threadId, html: args.html },
    );
    return "Document updated successfully.";
  },
});

const sceneSchema = z.object({
  id: z.string().describe("Unique short ID, e.g. 's1', 's2'"),
  name: z.string().describe("Scene title, e.g. 'Opening Hook'"),
  script: z.string().describe("Narration, dialogue, or action description"),
  avatarId: z
    .string()
    .describe("Avatar ID from listAvatars, or empty string if none"),
  sceneLayoutId: z
    .string()
    .describe("Scene layout ID from listSceneLayouts, or empty string if none"),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const updateStoryboard = createTool({
  description:
    "Create or replace the storyboard document with a title, optional description, and an array of scenes. " +
    "Use this instead of replaceDocument when working with storyboard scenes.",
  args: z.object({
    title: z.string().describe("The storyboard title"),
    description: z
      .string()
      .optional()
      .describe("Optional short description or context"),
    scenes: z
      .array(sceneSchema)
      .describe("Array of scene objects for the storyboard table"),
  }),
  handler: async (ctx, args) => {
    const threadId = ctx.threadId;
    if (!threadId) throw new Error("No thread context");

    const scenesAttr = escapeHtml(JSON.stringify(args.scenes));
    const parts: string[] = [
      `<h1>${escapeHtml(args.title)}</h1>`,
    ];
    if (args.description) {
      parts.push(`<p>${escapeHtml(args.description)}</p>`);
    }
    parts.push(
      `<div data-type="storyboard-table" data-scenes="${scenesAttr}"></div>`,
    );
    const html = parts.join("");

    await ctx.runMutation(
      internal.features.chat.setPendingContent,
      { threadId, html },
    );
    return "Storyboard updated successfully.";
  },
});

export const listAvatars = createTool({
  description:
    "List available avatars the user can choose from. Returns avatar IDs, names, and styles.",
  args: z.object({}),
  handler: async (ctx): Promise<string> => {
    const avatars = await ctx.runQuery(
      internal.features.avatars.listAvatarsInternal,
      {},
    );
    return JSON.stringify(avatars);
  },
});

export const listSceneLayouts = createTool({
  description:
    "List available scene layout types. Returns layout IDs, names, and descriptions. Use these IDs when creating storyboard table scenes.",
  args: z.object({}),
  handler: async (ctx): Promise<string> => {
    const layouts = await ctx.runQuery(
      internal.features.sceneLayouts.listSceneLayoutsInternal,
      {},
    );
    return JSON.stringify(layouts);
  },
});

export const proposeMemory = createTool({
  description:
    "Propose saving a fact or piece of knowledge about the user to long-term memory. " +
    "Use this when the user shares personal information, preferences, project details, " +
    "or domain knowledge that would be useful to remember across conversations. " +
    "The user will be asked to confirm before it is saved.",
  args: z.object({
    content: z
      .string()
      .describe(
        "The fact to remember, written in third person (e.g. 'User works at Acme Corp')",
      ),
    category: z.enum(["user_fact", "project", "domain", "preference"]),
  }),
  handler: async (ctx, args) => {
    const threadId = ctx.threadId;
    if (!threadId) throw new Error("No thread context");
    const userId = ctx.userId as Id<"users"> | undefined;
    if (!userId) throw new Error("No user context");

    await ctx.runMutation(
      internal.features.memory.proposePendingMemory,
      {
        threadId,
        userId,
        content: args.content,
        category: args.category,
      },
    );
    return "Memory proposed. Waiting for user confirmation.";
  },
});

// ---------------------------------------------------------------------------
// Display tools (chat widgets)
// ---------------------------------------------------------------------------

export const showOptions = createTool({
  description:
    "Display a set of choices for the user to pick from in the chat. " +
    "Use this instead of listing options as text. " +
    "Put any explanatory text in the 'message' field — do NOT output separate chat text alongside this tool.",
  args: z.object({
    message: z
      .string()
      .optional()
      .describe("Short contextual text shown as a header inside the widget"),
    options: z
      .array(
        z.object({
          id: z.string().describe("Unique option identifier"),
          label: z.string().describe("Display label the user sees"),
          description: z
            .string()
            .optional()
            .describe("Optional longer description"),
        }),
      )
      .describe("The choices to present"),
  }),
  handler: async () => "Options displayed",
});

export const showCard = createTool({
  description:
    "Display an informational card in the chat — use for summaries, tips, warnings, or key takeaways. " +
    "Put any explanatory text in the 'message' field — do NOT output separate chat text alongside this tool.",
  args: z.object({
    message: z
      .string()
      .optional()
      .describe("Short contextual text shown above the card body"),
    title: z.string().describe("Card heading"),
    body: z.string().describe("Card body text (plain text or short markdown)"),
    variant: z
      .enum(["info", "success", "warning"])
      .optional()
      .describe("Visual style — defaults to 'info'"),
  }),
  handler: async () => "Card displayed",
});

export const showSuggestions = createTool({
  description:
    "Display quick-reply suggestion chips the user can tap. " +
    "Use when suggesting possible next steps or follow-up actions. " +
    "Put any explanatory text in the 'message' field — do NOT output separate chat text alongside this tool.",
  args: z.object({
    message: z
      .string()
      .optional()
      .describe("Short contextual text shown as a header inside the widget"),
    suggestions: z
      .array(
        z.object({
          label: z.string().describe("Chip label the user sees and sends"),
        }),
      )
      .describe("The suggestion chips to display"),
  }),
  handler: async () => "Suggestions displayed",
});

export const memoryContextHandler: ContextHandler = async (ctx, args) => {
  if (args.userId) {
    const memories = (await ctx.runQuery(
      internal.features.memory.getAllConfirmedMemories,
      { userId: args.userId as Id<"users"> },
    )) as Array<{ content: string }>;
    if (memories.length > 0) {
      return [
        {
          role: "system" as const,
          content: `# Things I remember about this user\n${memories.map((m) => `- ${m.content}`).join("\n")}`,
        },
        ...args.allMessages,
      ];
    }
  }
  return args.allMessages;
};
