import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const proposePendingMemory = internalMutation({
  args: {
    threadId: v.string(),
    userId: v.id("users"),
    content: v.string(),
    category: v.string(),
  },
  handler: async (ctx, { threadId, userId, content, category }) => {
    const existing = await ctx.db
      .query("semanticMemories")
      .withIndex("by_userId_status", (q) => q.eq("userId", userId))
      .collect();

    const duplicate = existing.find(
      (m) =>
        m.content === content &&
        (m.status === "pending" || m.status === "confirmed"),
    );
    if (duplicate) return duplicate._id;

    return await ctx.db.insert("semanticMemories", {
      userId,
      content,
      category,
      status: "pending",
      threadId,
      createdAt: Date.now(),
    });
  },
});

export const confirmMemory = mutation({
  args: { memoryId: v.id("semanticMemories") },
  handler: async (ctx, { memoryId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const memory = await ctx.db.get(memoryId);
    if (!memory || memory.userId !== userId) {
      throw new Error("Memory not found");
    }
    if (memory.status !== "pending") return;

    await ctx.db.patch(memoryId, { status: "confirmed" });
  },
});

export const rejectMemory = mutation({
  args: { memoryId: v.id("semanticMemories") },
  handler: async (ctx, { memoryId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const memory = await ctx.db.get(memoryId);
    if (!memory || memory.userId !== userId) {
      throw new Error("Memory not found");
    }
    if (memory.status !== "pending") return;

    await ctx.db.patch(memoryId, { status: "rejected" });
  },
});

export const getPendingMemories = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("semanticMemories")
      .withIndex("by_threadId_status", (q) =>
        q.eq("threadId", threadId).eq("status", "pending"),
      )
      .collect();
  },
});

export const getAllConfirmedMemories = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("semanticMemories")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", userId).eq("status", "confirmed"),
      )
      .collect();
  },
});

export const listConfirmedMemories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("semanticMemories")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", userId).eq("status", "confirmed"),
      )
      .collect();
  },
});
