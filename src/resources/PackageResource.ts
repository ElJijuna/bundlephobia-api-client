import type { BundleSize } from '../domain/BundleSize';
import type { PackageHistory } from '../domain/PackageHistory';
import type { SimilarPackages } from '../domain/SimilarPackages';
import type { RequestFn } from './types';

/**
 * Represents a package resource on Bundlephobia, providing access to bundle
 * size, version history, and similar packages.
 *
 * Implements `PromiseLike<BundleSize>` so it can be awaited directly to fetch
 * the bundle size for the latest version.
 *
 * @example
 * ```typescript
 * // Await directly — resolves with the latest version bundle size
 * const size = await client.package('react');
 *
 * // Explicit call with optional version
 * const size18 = await client.package('react').size('18.2.0');
 *
 * // Size history across all versions
 * const history = await client.package('react').history();
 *
 * // Similar / alternative packages
 * const similar = await client.package('react').similar();
 * ```
 */
export class PackageResource implements PromiseLike<BundleSize> {
  /** @internal */
  constructor(
    private readonly request: RequestFn,
    private readonly name: string,
  ) {}

  /**
   * Allows the resource to be awaited directly, resolving with the bundle size
   * for the latest version. Delegates to {@link PackageResource.size}.
   */
  then<TResult1 = BundleSize, TResult2 = never>(
    onfulfilled?: ((value: BundleSize) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.size().then(onfulfilled, onrejected);
  }

  /**
   * Fetches the bundle size for this package.
   *
   * `GET /api/size?package={name}@{version}`
   *
   * @param version - Specific version to fetch (default: latest)
   * @param signal - Optional `AbortSignal` to cancel the request
   * @returns Bundle size data including minified and gzip sizes
   *
   * @example
   * ```typescript
   * const size = await client.package('react').size();
   * const size18 = await client.package('react').size('18.2.0');
   * console.log(size18.gzip); // 2670
   * ```
   */
  async size(version?: string, signal?: AbortSignal): Promise<BundleSize> {
    const pkg = version ? `${this.name}@${version}` : this.name;
    return this.request<BundleSize>('/api/size', { package: pkg }, signal);
  }

  /**
   * Fetches the bundle size history for this package across all published versions.
   *
   * `GET /api/package-history?package={name}`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   * @returns A map of version strings to their size and gzip values
   *
   * @example
   * ```typescript
   * const history = await client.package('react').history();
   * for (const [version, entry] of Object.entries(history)) {
   *   console.log(`${version} — ${entry.gzip}B gzip`);
   * }
   * ```
   */
  async history(signal?: AbortSignal): Promise<PackageHistory> {
    return this.request<PackageHistory>('/api/package-history', { package: this.name }, signal);
  }

  /**
   * Fetches similar/alternative packages to this one.
   *
   * `GET /api/similar-packages?package={name}`
   *
   * @param signal - Optional `AbortSignal` to cancel the request
   * @returns A list of alternative packages with their bundle sizes
   *
   * @example
   * ```typescript
   * const similar = await client.package('react').similar();
   * similar.alternativePackages.forEach(p => {
   *   console.log(`${p.name}@${p.version} — ${p.gzip}B gzip`);
   * });
   * ```
   */
  async similar(signal?: AbortSignal): Promise<SimilarPackages> {
    return this.request<SimilarPackages>('/api/similar-packages', { package: this.name }, signal);
  }
}
