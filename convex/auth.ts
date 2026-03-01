import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const validatePassword = mutation({
  args: { password: v.string(), name: v.string() },
  handler: async (ctx, { password, name }) => {
    const expected = process.env.DEMO_PASSWORD;
    if (!expected) throw new Error("DEMO_PASSWORD not configured on the server");
    if (password !== expected) throw new Error("Invalid password");

    const trimmed = name.trim();
    if (!trimmed) throw new Error("Name is required");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", trimmed))
      .unique();

    if (existing) return { userId: existing._id, name: existing.name };

    const userId = await ctx.db.insert("users", {
      name: trimmed,
      createdAt: Date.now(),
    });
    return { userId, name: trimmed };
  },
});
