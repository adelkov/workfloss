import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
} from "../_generated/server";

export const listSkillsByConfig = query({
  args: { agentConfigId: v.id("agentConfigs") },
  handler: async (ctx, { agentConfigId }) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_agentConfigId", (q) => q.eq("agentConfigId", agentConfigId))
      .collect();
  },
});

export const getSkill = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, { skillId }) => {
    return await ctx.db.get(skillId);
  },
});

export const createSkill = mutation({
  args: {
    agentConfigId: v.id("agentConfigs"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    procedure: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.agentConfigId);
    if (!config) throw new Error("Agent config not found");

    const existing = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`Skill with slug "${args.slug}" already exists`);

    const now = Date.now();
    return await ctx.db.insert("skills", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSkill = mutation({
  args: {
    skillId: v.id("skills"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    procedure: v.optional(v.string()),
  },
  handler: async (ctx, { skillId, ...patch }) => {
    const skill = await ctx.db.get(skillId);
    if (!skill) throw new Error("Skill not found");

    if (patch.slug && patch.slug !== skill.slug) {
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_slug", (q) => q.eq("slug", patch.slug!))
        .unique();
      if (existing) throw new Error(`Skill with slug "${patch.slug}" already exists`);
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(skillId, updates);
  },
});

export const archiveSkill = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, { skillId }) => {
    const skill = await ctx.db.get(skillId);
    if (!skill) throw new Error("Skill not found");
    await ctx.db.patch(skillId, { status: "archived", updatedAt: Date.now() });
  },
});

export const restoreSkill = mutation({
  args: { skillId: v.id("skills") },
  handler: async (ctx, { skillId }) => {
    const skill = await ctx.db.get(skillId);
    if (!skill) throw new Error("Skill not found");
    await ctx.db.patch(skillId, { status: "active", updatedAt: Date.now() });
  },
});

export const getActiveSkillsByConfigId = internalQuery({
  args: { agentConfigId: v.id("agentConfigs") },
  handler: async (ctx, { agentConfigId }) => {
    const skills = await ctx.db
      .query("skills")
      .withIndex("by_agentConfigId", (q) => q.eq("agentConfigId", agentConfigId))
      .collect();
    return skills.filter((s) => s.status === "active");
  },
});

export const getSkillBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});
