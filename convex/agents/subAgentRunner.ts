"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, components } from "../_generated/api";
import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { readDocument, replaceDocument } from "./sharedTools";
import type { Id } from "../_generated/dataModel";
import type { ToolSet } from "ai";

export const run = internalAction({
  args: {
    agentSlug: v.string(),
    task: v.string(),
    threadId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const config = await ctx.runQuery(
      internal.features.agentConfigs.getConfigBySlug,
      { slug: args.agentSlug },
    );
    if (!config) throw new Error(`Agent config "${args.agentSlug}" not found`);
    if (config.status !== "active") throw new Error(`Agent config "${args.agentSlug}" is archived`);

    const skills = await ctx.runQuery(
      internal.features.skills.getActiveSkillsByConfigId,
      { agentConfigId: config._id },
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dynamicTools: Record<string, any> = {};

    for (const skill of skills) {
      dynamicTools[`skill_${skill.slug}`] = createTool({
        description: skill.description,
        args: z.object({
          context: z
            .string()
            .optional()
            .describe("Additional context for executing this skill"),
        }),
        handler: async (toolCtx, toolArgs) => {
          const templates = await toolCtx.runQuery(
            internal.features.skillTemplates.getTemplatesBySkillId,
            { skillId: skill._id as Id<"skills"> },
          );

          let output = `# Procedure: ${skill.name}\n\n${skill.procedure}`;
          if (toolArgs.context) {
            output += `\n\n# Task Context\n${toolArgs.context}`;
          }
          if (templates.length > 0) {
            output += `\n\n# Available Templates (use loadTemplate tool to get full content)\n`;
            output += templates
              .map((t: { slug: string; description: string; fileType: string }) =>
                `- ${t.slug}: ${t.description} (${t.fileType})`,
              )
              .join("\n");
          }
          return output;
        },
      });
    }

    dynamicTools.loadTemplate = createTool({
      description:
        "Load a template file by slug. Returns the full template content.",
      args: z.object({
        slug: z.string().describe("Template slug"),
      }),
      handler: async (toolCtx, toolArgs) => {
        const template = await toolCtx.runQuery(
          internal.features.skillTemplates.getTemplateBySlug,
          { slug: toolArgs.slug },
        );
        if (!template) return "Template not found.";
        return `# Template: ${template.name} (${template.fileType})\n\n${template.content}`;
      },
    });

    dynamicTools.readDocument = readDocument;
    dynamicTools.replaceDocument = replaceDocument;

    const model = config.model || "gpt-5.2";
    const subAgent = new Agent(components.agent, {
      name: config.name,
      languageModel: openai(model),
      instructions: config.instructions,
      tools: dynamicTools as ToolSet,
      maxSteps: config.maxSteps || 10,
    });

    const result = await subAgent.generateText(
      ctx,
      { threadId: args.threadId, userId: args.userId },
      { prompt: args.task },
    );

    return result.text;
  },
});
