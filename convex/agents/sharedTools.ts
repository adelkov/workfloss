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
