import { defineMcp } from "@lovable.dev/mcp-js";
import listShiftQueue from "./tools/list-shift-queue";
import getStudentFeedback from "./tools/get-student-feedback";
import listRequirements from "./tools/list-requirements";

export default defineMcp({
  name: "fisdap-copilot-mcp",
  title: "FISDAP AI Shift Feedback Copilot",
  version: "0.1.0",
  instructions:
    "Tools for the FISDAP EMS education prototype. Use `list_shift_queue` to view instructor submissions, `get_student_feedback` to read approved feedback reports, and `list_requirements` to check a student's clinical progress.",
  tools: [listShiftQueue, getStudentFeedback, listRequirements],
});
