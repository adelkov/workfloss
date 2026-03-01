import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

export const saveSelection = mutation({
  args: {
    documentId: v.id("documents"),
    text: v.string(),
    html: v.string(),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, { documentId, text, html, from, to }) => {
    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");
    const userId = doc.userId;

    const activeSelections = await ctx.db
      .query("selections")
      .withIndex("by_documentId_status", (q) =>
        q.eq("documentId", documentId).eq("status", "active"),
      )
      .collect();

    for (const sel of activeSelections) {
      await ctx.db.patch(sel._id, { status: "dismissed" as const });
    }

    return await ctx.db.insert("selections", {
      userId,
      documentId,
      text,
      html,
      from,
      to,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const dismissSelection = mutation({
  args: { selectionId: v.id("selections") },
  handler: async (ctx, { selectionId }) => {
    const sel = await ctx.db.get(selectionId);
    if (!sel) throw new Error("Selection not found");

    await ctx.db.patch(selectionId, { status: "dismissed" });
  },
});

export const markSelectionUsed = mutation({
  args: { selectionId: v.id("selections") },
  handler: async (ctx, { selectionId }) => {
    const sel = await ctx.db.get(selectionId);
    if (!sel) throw new Error("Selection not found");

    await ctx.db.patch(selectionId, { status: "used" });
  },
});

export const dismissActiveSelection = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const active = await ctx.db
      .query("selections")
      .withIndex("by_documentId_status", (q) =>
        q.eq("documentId", documentId).eq("status", "active"),
      )
      .collect();

    for (const sel of active) {
      await ctx.db.patch(sel._id, { status: "dismissed" as const });
    }
  },
});

export const getActiveSelection = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    return await ctx.db
      .query("selections")
      .withIndex("by_documentId_status", (q) =>
        q.eq("documentId", documentId).eq("status", "active"),
      )
      .first();
  },
});
