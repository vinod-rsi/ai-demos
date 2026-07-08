import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_requirements",
  title: "List student clinical requirements",
  description: "List a student's remaining clinical requirements and progress toward case quotas.",
  inputSchema: {
    studentId: z.string().min(1).describe("Student ID or name slug."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ studentId }) => {
    const requirements = {
      studentId,
      overallCompletion: 0.72,
      items: [
        { name: "Cardiac encounters", required: 5, completed: 4, remaining: 1 },
        { name: "Pediatric encounters", required: 3, completed: 3, remaining: 0 },
        { name: "Trauma encounters", required: 4, completed: 2, remaining: 2 },
        { name: "Ride-along hours", required: 48, completed: 36, remaining: 12 },
      ],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(requirements, null, 2) }],
      structuredContent: requirements,
    };
  },
});
