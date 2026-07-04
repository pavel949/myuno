import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

/**
 * Returns the signed-in myUNO user (via OAuth). Requires auth.
 */
export default defineTool({
  name: "whoami",
  title: "Who am I",
  description: "Returns the signed-in myUNO user's id and email.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const info = { userId: ctx.getUserId(), email: ctx.getUserEmail() };
    return {
      content: [{ type: "text", text: JSON.stringify(info) }],
      structuredContent: info,
    };
  },
});
