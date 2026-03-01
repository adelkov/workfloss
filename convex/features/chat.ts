import { v } from "convex/values";
import {
  query,
  mutation,
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { internal, components } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createThread, saveMessage, listUIMessages } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { getAgent } from "../agent";

export const listChats = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, { type }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const docs = await ctx.db
      .query("documents")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (!type || type === "freeform") {
      return docs.filter((d) => !d.type || d.type === "freeform");
    }
    return docs.filter((d) => d.type === type);
  },
});

export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const doc = await ctx.db.get(documentId);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});

export const createChat = mutation({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, { type }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const threadId = await createThread(ctx, components.agent, { userId });

    const docType = type || "freeform";
    const docId = await ctx.db.insert("documents", {
      threadId,
      title: "New Chat",
      userId,
      type: docType,
      createdAt: Date.now(),
    });

    return docId;
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendMessage = mutation({
  args: {
    documentId: v.id("documents"),
    prompt: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, { documentId, prompt, storageId, fileName, mimeType }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(documentId);
    if (!doc || doc.userId !== userId) throw new Error("Document not found");

    const displayPrompt =
      fileName ? `📎 ${fileName}\n${prompt}` : prompt;

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: doc.threadId,
      prompt: displayPrompt,
    });

    if (doc.title === "New Chat") {
      const title = prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt;
      await ctx.db.patch(documentId, { title });
    }

    await ctx.db.patch(documentId, { agentStatus: "working" });

    await ctx.scheduler.runAfter(0, internal.features.chat.generateResponse, {
      threadId: doc.threadId,
      promptMessageId: messageId,
      userId,
      documentType: doc.type ?? "freeform",
      storageId,
      fileName,
      mimeType,
      promptText: prompt,
    });

    return messageId;
  },
});

export const generateResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    userId: v.id("users"),
    documentType: v.string(),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    promptText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { threadId, promptMessageId, userId, documentType, storageId, promptText } = args;
    const agent = getAgent(documentType);

    try {
      if (storageId && promptText) {
        const fileUrl = await ctx.storage.getUrl(storageId);
        if (fileUrl) {
          const mediaType = args.mimeType || "application/octet-stream";
          await agent.generateText(
            ctx,
            { threadId, userId },
            {
              promptMessageId,
              prompt: [
                {
                  role: "user" as const,
                  content: [
                    { type: "text" as const, text: promptText },
                    { type: "file" as const, data: new URL(fileUrl), mediaType },
                  ],
                },
              ],
            },
          );
          await ctx.runMutation(internal.features.chat.setAgentStatus, {
            threadId,
            status: "completed" as const,
          });
          return;
        }
      }

      await agent.generateText(
        ctx,
        { threadId, userId },
        { promptMessageId },
      );
      await ctx.runMutation(internal.features.chat.setAgentStatus, {
        threadId,
        status: "completed" as const,
      });
    } catch (error) {
      await ctx.runMutation(internal.features.chat.setAgentStatus, {
        threadId,
        status: "error" as const,
      });
      throw error;
    }
  },
});

export const setAgentStatus = internalMutation({
  args: {
    threadId: v.string(),
    status: v.union(
      v.literal("idle"),
      v.literal("working"),
      v.literal("completed"),
      v.literal("error"),
    ),
  },
  handler: async (ctx, { threadId, status }) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .unique();
    if (!doc) return;
    await ctx.db.patch(doc._id, { agentStatus: status });
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, paginationOpts }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await listUIMessages(ctx, components.agent, {
      threadId,
      paginationOpts,
    });
  },
});

export const deleteChat = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(documentId);
    if (!doc || doc.userId !== userId) throw new Error("Document not found");

    await ctx.db.delete(documentId);
  },
});

export const getDocumentContentByThread = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .unique();
    if (!doc) return null;
    return doc.documentContent ?? null;
  },
});

export const setPendingContent = internalMutation({
  args: {
    threadId: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { threadId, html }) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .unique();
    if (!doc) throw new Error("Document not found for thread");
    await ctx.db.patch(doc._id, { pendingContent: html });
  },
});

export const clearPendingContent = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const doc = await ctx.db.get(documentId);
    if (!doc || doc.userId !== userId) return;
    await ctx.db.patch(documentId, { pendingContent: undefined });
  },
});
