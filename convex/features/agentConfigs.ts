import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
} from "../_generated/server";

export const listAgentConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("agentConfigs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

export const listAllAgentConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agentConfigs").collect();
  },
});

export const getAgentConfig = query({
  args: { configId: v.id("agentConfigs") },
  handler: async (ctx, { configId }) => {
    return await ctx.db.get(configId);
  },
});

export const createAgentConfig = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    instructions: v.string(),
    model: v.optional(v.string()),
    maxSteps: v.optional(v.number()),
    assignedAgentTypes: v.array(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentConfigs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`Agent config with slug "${args.slug}" already exists`);

    const now = Date.now();
    return await ctx.db.insert("agentConfigs", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAgentConfig = mutation({
  args: {
    configId: v.id("agentConfigs"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    instructions: v.optional(v.string()),
    model: v.optional(v.string()),
    maxSteps: v.optional(v.number()),
    assignedAgentTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { configId, ...patch }) => {
    const config = await ctx.db.get(configId);
    if (!config) throw new Error("Agent config not found");

    if (patch.slug && patch.slug !== config.slug) {
      const existing = await ctx.db
        .query("agentConfigs")
        .withIndex("by_slug", (q) => q.eq("slug", patch.slug!))
        .unique();
      if (existing) throw new Error(`Agent config with slug "${patch.slug}" already exists`);
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(configId, updates);
  },
});

export const archiveAgentConfig = mutation({
  args: { configId: v.id("agentConfigs") },
  handler: async (ctx, { configId }) => {
    const config = await ctx.db.get(configId);
    if (!config) throw new Error("Agent config not found");
    await ctx.db.patch(configId, { status: "archived", updatedAt: Date.now() });
  },
});

export const restoreAgentConfig = mutation({
  args: { configId: v.id("agentConfigs") },
  handler: async (ctx, { configId }) => {
    const config = await ctx.db.get(configId);
    if (!config) throw new Error("Agent config not found");
    await ctx.db.patch(configId, { status: "active", updatedAt: Date.now() });
  },
});

export const getConfigsForAgentType = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const doc = await ctx.db
      .query("documents")
      .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
      .unique();
    const docType = doc?.type ?? "freeform";

    const configs = await ctx.db
      .query("agentConfigs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return configs
      .filter(
        (c) =>
          c.assignedAgentTypes.includes(docType) ||
          c.assignedAgentTypes.includes("*"),
      )
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.instructions.slice(0, 200),
      }));
  },
});

export const getConfigBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("agentConfigs")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});
