import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
} from "../_generated/server";

export const listTemplatesBySkill = query({
  args: { skillId: v.id("skills") },
  handler: async (ctx, { skillId }) => {
    return await ctx.db
      .query("skillTemplates")
      .withIndex("by_skillId", (q) => q.eq("skillId", skillId))
      .collect();
  },
});

export const createTemplate = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.skillId);
    if (!skill) throw new Error("Skill not found");

    const existing = await ctx.db
      .query("skillTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`Template with slug "${args.slug}" already exists`);

    return await ctx.db.insert("skillTemplates", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateTemplate = mutation({
  args: {
    templateId: v.id("skillTemplates"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    fileType: v.optional(
      v.union(
        v.literal("template"),
        v.literal("example"),
        v.literal("reference"),
      ),
    ),
  },
  handler: async (ctx, { templateId, ...patch }) => {
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    if (patch.slug && patch.slug !== template.slug) {
      const existing = await ctx.db
        .query("skillTemplates")
        .withIndex("by_slug", (q) => q.eq("slug", patch.slug!))
        .unique();
      if (existing) throw new Error(`Template with slug "${patch.slug}" already exists`);
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) updates[key] = value;
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(templateId, updates);
    }
  },
});

export const deleteTemplate = mutation({
  args: { templateId: v.id("skillTemplates") },
  handler: async (ctx, { templateId }) => {
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");
    await ctx.db.delete(templateId);
  },
});

export const getTemplateBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("skillTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const getTemplatesBySkillId = internalQuery({
  args: { skillId: v.id("skills") },
  handler: async (ctx, { skillId }) => {
    return await ctx.db
      .query("skillTemplates")
      .withIndex("by_skillId", (q) => q.eq("skillId", skillId))
      .collect();
  },
});
