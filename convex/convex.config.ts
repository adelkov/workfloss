import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config.js";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";

const app = defineApp();
app.use(agent);
app.use(prosemirrorSync);
export default app;
