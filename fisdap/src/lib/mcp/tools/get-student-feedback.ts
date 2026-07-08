import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_student_feedback",
  title: "Get student feedback report",
  description: "Return the approved instructor feedback report for a student submission, including narrative, evidence map, and action items.",
  inputSchema: {
    submissionId: z.string().min(1).describe("Submission ID, e.g. sub-102."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ submissionId }) => {
    const feedback = {
      submissionId,
      student: "Marcus Lee",
      approvedBy: "Instructor Chen",
      approvedAt: "2026-07-05T19:40:00Z",
      narrative:
        "Strong scene size-up and BSI. Vitals were reassessed at appropriate intervals. Handoff to receiving facility was concise. Continue building confidence in cardiac rhythm interpretation.",
      evidenceMap: [
        { competency: "Patient Assessment", evidence: "PCR §1, §3", strength: "meets" },
        { competency: "Airway Management", evidence: "PCR §2", strength: "meets" },
        { competency: "Cardiac Care", evidence: "PCR §4", strength: "developing" },
      ],
      actionItems: [
        "Review 12-lead ECG interpretation module",
        "Complete 1 more cardiac encounter to meet quota",
      ],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(feedback, null, 2) }],
      structuredContent: feedback,
    };
  },
});
