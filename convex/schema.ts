import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  documents: defineTable({
    threadId: v.string(),
    title: v.string(),
    userId: v.id("users"),
    type: v.optional(v.string()),
    createdAt: v.number(),
    pendingContent: v.optional(v.string()),
    documentContent: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "type"])
    .index("by_threadId", ["threadId"]),
  semanticMemories: defineTable({
    userId: v.id("users"),
    content: v.string(),
    category: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("rejected"),
    ),
    threadId: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId_status", ["userId", "status"])
    .index("by_threadId_status", ["threadId", "status"]),
  avatars: defineTable({
    name: v.string(),
    style: v.string(),
    seed: v.string(),
    createdAt: v.number(),
  }).index("by_style", ["style"]),
});
