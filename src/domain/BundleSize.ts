/**
 * A single asset included in the bundle.
 *
 * Returned as part of {@link BundleSize.assets}.
 */
export interface BundleAsset {
  /** Asset identifier (e.g. `'main'`) */
  name: string;
  /** Minified size in bytes */
  size: number;
  /** Gzip-compressed size in bytes */
  gzip: number;
  /** Asset type (e.g. `'js'`, `'css'`) */
  type: string;
}

/**
 * Approximate size contribution of a single dependency to the final bundle.
 *
 * Returned as part of {@link BundleSize.dependencySizes}.
 */
export interface DependencySize {
  /** Dependency package name */
  name: string;
  /** Approximate size contribution in bytes */
  approximateSize: number;
}

/**
 * Bundle size information for a specific package version.
 *
 * Returned by `GET /api/size?package={name}@{version}`.
 *
 * @example
 * ```typescript
 * const size = await client.package('react').size('18.2.0');
 * console.log(size.gzip); // 2670
 * ```
 */
export interface BundleSize {
  /** Package name */
  name: string;
  /** Resolved version */
  version: string;
  /** Package description from package.json */
  description: string;
  /** Minified size in bytes */
  size: number;
  /** Gzip-compressed size in bytes */
  gzip: number;
  /** Number of transitive dependencies included in the bundle */
  dependencyCount: number;
  /** Whether the package is known to have side effects */
  hasSideEffects: boolean | 'unknown';
  /** Whether the package exports an ES module via the `module` field */
  hasJSModule: boolean;
  /** Whether the package exports an ES module via the `jsnext:main` field */
  hasJSNext: boolean;
  /** Whether the package.json declares `"type": "module"` */
  isModuleType: boolean;
  /** Whether the package name is scoped (e.g. `@scope/pkg`) */
  scoped: boolean;
  /** Individual assets that make up the bundle */
  assets: BundleAsset[];
  /** Per-dependency size breakdown */
  dependencySizes: DependencySize[];
}
