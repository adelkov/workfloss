import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),
  documents: defineTable({
    threadId: v.string(),
    title: v.string(),
    userId: v.id("users"),
    type: v.optional(v.string()),
    createdAt: v.number(),
    pendingContent: v.optional(v.string()),
    documentContent: v.optional(v.string()),
    agentStatus: v.optional(
      v.union(
        v.literal("idle"),
        v.literal("working"),
        v.literal("completed"),
        v.literal("error"),
      ),
    ),
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
  sceneLayouts: defineTable({
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
  }),
  selections: defineTable({
    userId: v.id("users"),
    documentId: v.id("documents"),
    text: v.string(),
    html: v.string(),
    from: v.number(),
    to: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("used"),
      v.literal("dismissed"),
    ),
    createdAt: v.number(),
  })
    .index("by_documentId_status", ["documentId", "status"])
    .index("by_userId", ["userId"]),
  agentConfigs: defineTable({
    name: v.string(),
    slug: v.string(),
    instructions: v.string(),
    model: v.optional(v.string()),
    maxSteps: v.optional(v.number()),
    assignedAgentTypes: v.array(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),
  skills: defineTable({
    agentConfigId: v.id("agentConfigs"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    procedure: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_agentConfigId", ["agentConfigId"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),
  skillTemplates: defineTable({
    skillId: v.id("skills"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    content: v.string(),
    fileType: v.union(
      v.literal("template"),
      v.literal("example"),
      v.literal("reference"),
    ),
    createdAt: v.number(),
  })
    .index("by_skillId", ["skillId"])
    .index("by_slug", ["slug"]),
});
