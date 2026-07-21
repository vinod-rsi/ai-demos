/**
 * Abstraction over where content files come from. Content is fetched from the
 * imported unity/ folder under the app's base URL.
 */
export interface ContentSource {
  /** Read and parse a JSON file. Returns null if the file doesn't exist. */
  readJson<T>(relativePath: string): Promise<T | null>;
  /** List file names (not paths) in a directory. */
  listFiles(relativeDir: string): Promise<string[]>;
  /** Whether a file exists (used for audio checks in validation). */
  exists(relativePath: string): Promise<boolean>;
}

/** Browser source rooted at a URL prefix such as "/unity/logic". */
export class FetchContentSource implements ContentSource {
  constructor(private baseUrl: string) {}

  async readJson<T>(relativePath: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}/${relativePath}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load ${relativePath}: ${res.status}`);
    return (await res.json()) as T;
  }

  /**
   * Static hosts can't list a directory, so the import script writes a
   * `__list.json` manifest next to the files (scripts/import-unity-assets.mjs).
   */
  async listFiles(relativeDir: string): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/${relativeDir}/__list.json`);
    if (!res.ok) return [];
    return (await res.json()) as string[];
  }

  async exists(relativePath: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${relativePath}`, { method: 'HEAD' });
    return res.ok;
  }
}
