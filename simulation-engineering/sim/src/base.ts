/**
 * The sim ships inside the Simulation Engineering demo, which is itself hosted
 * from a subdirectory on GitHub Pages, so nothing may be fetched from an
 * absolute "/..." path. Every content URL goes through here instead.
 *
 * BASE_URL is "/" under `vite dev` and "/ai-demos/simulation-engineering/sim/"
 * in the deployed build (vite.config.ts).
 */
export const BASE_URL = import.meta.env.BASE_URL;

/** Resolves a content path ("unity/logic") against the deployed base. */
export function asset(relativePath: string): string {
  return `${BASE_URL}${relativePath.replace(/^\//, '')}`;
}
