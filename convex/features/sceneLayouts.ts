import { query, mutation, internalQuery } from "../_generated/server";

export const listSceneLayouts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sceneLayouts").collect();
  },
});

export const listSceneLayoutsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const layouts = await ctx.db.query("sceneLayouts").collect();
    return layouts.map((l) => ({
      _id: l._id,
      name: l.name,
      description: l.description,
    }));
  },
});

const SEED_LAYOUTS: Array<{ name: string; description: string }> = [
  { name: "Title Card", description: "Full-screen title with optional subtitle" },
  { name: "Intro", description: "Opening scene that sets context and hooks the viewer" },
  { name: "3 Bullet Points", description: "Three key points displayed sequentially" },
  { name: "Image + Title", description: "Visual with an overlaid heading" },
  { name: "Quote / Callout", description: "Highlighted quote or key takeaway" },
  { name: "Split Screen", description: "Side-by-side comparison or dual content" },
  { name: "Full Screen Video", description: "Full-frame video or animation clip" },
  { name: "Outro / CTA", description: "Closing scene with call-to-action" },
];

export const seedSceneLayouts = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("sceneLayouts").first();
    if (existing) return { seeded: false, message: "Scene layouts already exist" };

    const now = Date.now();
    for (const layout of SEED_LAYOUTS) {
      await ctx.db.insert("sceneLayouts", { ...layout, createdAt: now });
    }
    return { seeded: true, message: `Seeded ${SEED_LAYOUTS.length} scene layouts` };
  },
});
