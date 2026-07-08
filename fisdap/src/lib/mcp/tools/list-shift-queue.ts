import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const QUEUE = [
  { id: "sub-101", student: "Priya Anand", cohort: "EMT-2026A", shift: "Ride-along #4", tier: "urgent", status: "Needs Data Check", submittedAt: "2026-07-05T18:22:00Z" },
  { id: "sub-102", student: "Marcus Lee", cohort: "EMT-2026A", shift: "Clinical #7", tier: "ready", status: "AI Draft Ready", submittedAt: "2026-07-05T17:10:00Z" },
  { id: "sub-103", student: "Jordan Rivera", cohort: "Paramedic-2026", shift: "Ride-along #2", tier: "pending", status: "Awaiting Submission", submittedAt: null },
  { id: "sub-104", student: "Sam Okafor", cohort: "EMT-2026A", shift: "Clinical #6", tier: "approved", status: "Approved", submittedAt: "2026-07-04T14:05:00Z" },
];

export default defineTool({
  name: "list_shift_queue",
  title: "List instructor shift queue",
  description: "List EMS student shift submissions in the instructor queue, optionally filtered by urgency tier.",
  inputSchema: {
    tier: z.enum(["urgent", "ready", "pending", "approved"]).optional().describe("Filter by urgency tier."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ tier }) => {
    const items = tier ? QUEUE.filter((q) => q.tier === tier) : QUEUE;
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items },
    };
  },
});
