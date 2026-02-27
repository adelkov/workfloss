"use node";

import { Agent, createTool } from "@convex-dev/agent";
import type { ModelMessage } from "@ai-sdk/provider-utils";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const documentAgent = new Agent(components.agent, {
  name: "Document Editor",
  languageModel: openai("gpt-4o"),
  instructions: `You are an AI document editing assistant. You help users create, edit, and improve documents.

Before making any edits, ALWAYS use readDocument first to see the current document content. The user may have made manual edits that are not in the chat history.

When a user asks you to write, edit, or modify a document, use the replaceDocument tool to update the document content.

Provide full HTML content using: headings (h1-h3), paragraphs (p), lists (ul/ol with li), bold (strong), italic (em), code blocks (pre > code), inline code (code), blockquotes (blockquote), and horizontal rules (hr).

Always provide the complete document content — not just the changed portion.

When a user asks a question or wants to discuss without document changes, respond conversationally without using any tools.

When the user shares personal information, preferences, project details, or domain knowledge that would be useful to remember across conversations, use the proposeMemory tool to suggest saving it. Examples: their name, company, role, writing style preferences, project context, or domain terminology. Do not propose memories for transient requests or single-use instructions.`,
  tools: {
    readDocument: createTool({
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
    }),
    replaceDocument: createTool({
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
    }),
    proposeMemory: createTool({
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
    }),
  },
  contextHandler: async (ctx, args): Promise<ModelMessage[]> => {
    if (args.userId) {
      const memories: Array<{ content: string }> = await ctx.runQuery(
        internal.features.memory.getAllConfirmedMemories,
        { userId: args.userId as Id<"users"> },
      );
      if (memories.length > 0) {
        const memoryMessage: ModelMessage = {
          role: "system",
          content: `# Things I remember about this user\n${memories.map((m) => `- ${m.content}`).join("\n")}`,
        };
        return [memoryMessage, ...args.allMessages];
      }
    }
    return args.allMessages;
  },
  maxSteps: 6,
});
