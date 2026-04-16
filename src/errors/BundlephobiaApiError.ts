/**
 * Thrown when the Bundlephobia API returns a non-2xx response.
 *
 * @example
 * ```typescript
 * import { BundlephobiaApiError } from 'bundlephobia-api-client';
 *
 * try {
 *   await client.package('nonexistent-pkg-xyz').size();
 * } catch (err) {
 *   if (err instanceof BundlephobiaApiError) {
 *     console.log(err.status);     // 404
 *     console.log(err.statusText); // 'Not Found'
 *     console.log(err.message);    // 'Bundlephobia API error: 404 Not Found'
 *   }
 * }
 * ```
 */
export class BundlephobiaApiError extends Error {
  /** HTTP status code (e.g. `404`, `500`) */
  readonly status: number;
  /** HTTP status text (e.g. `'Not Found'`) */
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`Bundlephobia API error: ${status} ${statusText}`);
    this.name = 'BundlephobiaApiError';
    this.status = status;
    this.statusText = statusText;
  }
}
