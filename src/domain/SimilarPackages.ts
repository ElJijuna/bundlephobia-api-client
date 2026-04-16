/**
 * A single alternative package entry within a similar packages response.
 *
 * Returned as part of {@link SimilarPackages.alternativePackages}.
 */
export interface SimilarPackage {
  /** Package name */
  name: string;
  /** Latest version */
  version: string;
  /** Package description from package.json */
  description: string;
  /** Minified size in bytes */
  size: number;
  /** Gzip-compressed size in bytes */
  gzip: number;
}

/**
 * Similar/alternative packages for a given package.
 *
 * Returned by `GET /api/similar-packages?package={name}`.
 *
 * @example
 * ```typescript
 * const similar = await client.package('react').similar();
 * similar.alternativePackages.forEach(p => {
 *   console.log(`${p.name}@${p.version} — ${p.gzip}B gzip`);
 * });
 * ```
 */
export interface SimilarPackages {
  /** List of alternative packages with their bundle sizes */
  alternativePackages: SimilarPackage[];
}
