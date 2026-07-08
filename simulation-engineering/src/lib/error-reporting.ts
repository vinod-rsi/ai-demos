type ErrorReportOptions = Record<string, unknown>;

export function reportClientError(error: unknown, context: ErrorReportOptions = {}) {
  if (typeof window === "undefined") return;
  // Client-side error hook. Wire up your telemetry provider here if desired.
  console.error("[error]", error, {
    route: window.location.pathname,
    ...context,
  });
}
