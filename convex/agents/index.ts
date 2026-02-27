"use node";

import type { Agent } from "@convex-dev/agent";
import { freeformAgent } from "./freeform";
import { storyboardAgent } from "./storyboard";
import { courseOutlineAgent } from "./courseOutline";

// Agents have different tool sets, so we use the base Agent type
const agentMap: Record<string, Agent> = {
  freeform: freeformAgent,
  storyboard: storyboardAgent,
  course_outline: courseOutlineAgent,
};

export function getAgent(documentType: string | undefined): Agent {
  return agentMap[documentType ?? "freeform"] ?? freeformAgent;
}
