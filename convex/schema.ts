import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  documents: defineTable({
    threadId: v.string(),
    title: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    pendingContent: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_threadId", ["threadId"]),
});
