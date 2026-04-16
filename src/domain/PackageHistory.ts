/**
 * Size data for a single version within a package history response.
 *
 * Returned as values in {@link PackageHistory}.
 */
export interface HistoryEntry {
  /** Minified size in bytes */
  size: number;
  /** Gzip-compressed size in bytes */
  gzip: number;
}

/**
 * Bundle size history for a package across all published versions.
 *
 * Returned by `GET /api/package-history?package={name}`.
 * Keys are version strings, values are {@link HistoryEntry} objects.
 *
 * @example
 * ```typescript
 * const history = await client.package('react').history();
 * for (const [version, entry] of Object.entries(history)) {
 *   console.log(`${version} — ${entry.gzip}B gzip`);
 * }
 * ```
 */
export type PackageHistory = Record<string, HistoryEntry>;
