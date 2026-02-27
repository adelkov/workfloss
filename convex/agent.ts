"use node";

import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { components, internal } from "./_generated/api";

export const documentAgent = new Agent(components.agent, {
  name: "Document Editor",
  languageModel: openai("gpt-4o"),
  instructions: `You are an AI document editing assistant. You help users create, edit, and improve documents.

Before making any edits, ALWAYS use readDocument first to see the current document content. The user may have made manual edits that are not in the chat history.

When a user asks you to write, edit, or modify a document, use the replaceDocument tool to update the document content.

Provide full HTML content using: headings (h1-h3), paragraphs (p), lists (ul/ol with li), bold (strong), italic (em), code blocks (pre > code), inline code (code), blockquotes (blockquote), and horizontal rules (hr).

Always provide the complete document content — not just the changed portion.

When a user asks a question or wants to discuss without document changes, respond conversationally without using any tools.`,
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
  },
  maxSteps: 5,
});
