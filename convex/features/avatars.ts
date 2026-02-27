import { v } from "convex/values";
import { query, mutation, internalQuery } from "../_generated/server";

export const listAvatars = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("avatars").collect();
  },
});

export const listAvatarsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const avatars = await ctx.db.query("avatars").collect();
    return avatars.map((a) => ({
      _id: a._id,
      name: a.name,
      style: a.style,
      seed: a.seed,
    }));
  },
});

const SEED_AVATARS: Array<{ name: string; style: string; seed: string }> = [
  { name: "Felix", style: "adventurer", seed: "Felix" },
  { name: "Aneka", style: "adventurer", seed: "Aneka" },
  { name: "Jasper", style: "adventurer", seed: "Jasper" },
  { name: "Luna", style: "adventurer", seed: "Luna" },
  { name: "Milo", style: "adventurer", seed: "Milo" },
  { name: "Bolt", style: "bottts", seed: "Bolt" },
  { name: "Sparky", style: "bottts", seed: "Sparky" },
  { name: "Circuit", style: "bottts", seed: "Circuit" },
  { name: "Pixel", style: "bottts", seed: "Pixel" },
  { name: "Glitch", style: "bottts", seed: "Glitch" },
  { name: "Sunny", style: "fun-emoji", seed: "Sunny" },
  { name: "Blaze", style: "fun-emoji", seed: "Blaze" },
  { name: "Chill", style: "fun-emoji", seed: "Chill" },
  { name: "Spark", style: "fun-emoji", seed: "Spark" },
  { name: "Doodle", style: "fun-emoji", seed: "Doodle" },
  { name: "Aria", style: "notionists", seed: "Aria" },
  { name: "Blake", style: "notionists", seed: "Blake" },
  { name: "Sage", style: "notionists", seed: "Sage" },
  { name: "Quinn", style: "notionists", seed: "Quinn" },
  { name: "Reese", style: "notionists", seed: "Reese" },
];

export const seedAvatars = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("avatars").first();
    if (existing) return { seeded: false, message: "Avatars already exist" };

    const now = Date.now();
    for (const avatar of SEED_AVATARS) {
      await ctx.db.insert("avatars", { ...avatar, createdAt: now });
    }
    return { seeded: true, message: `Seeded ${SEED_AVATARS.length} avatars` };
  },
});
