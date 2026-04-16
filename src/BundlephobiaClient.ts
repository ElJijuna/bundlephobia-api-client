import { BundlephobiaApiError } from './errors/BundlephobiaApiError';
import { PackageResource } from './resources/PackageResource';

const DEFAULT_BASE_URL = 'https://bundlephobia.com';

/**
 * Payload emitted on every HTTP request made by {@link BundlephobiaClient}.
 */
export interface RequestEvent {
  /** Full URL that was requested */
  url: string;
  /** HTTP method used */
  method: 'GET';
  /** Timestamp when the request started */
  startedAt: Date;
  /** Timestamp when the request finished (success or error) */
  finishedAt: Date;
  /** Total duration in milliseconds */
  durationMs: number;
  /** HTTP status code returned by the server, if a response was received */
  statusCode?: number;
  /** Error thrown, if the request failed */
  error?: Error;
}

/** Map of supported client events to their callback signatures */
export interface BundlephobiaClientEvents {
  request: (event: RequestEvent) => void;
}

/**
 * Constructor options for {@link BundlephobiaClient}.
 */
export interface BundlephobiaClientOptions {
  /**
   * Base URL for the Bundlephobia API (default: `'https://bundlephobia.com'`).
   * Override for self-hosted instances or testing.
   */
  baseUrl?: string;
}

/**
 * Main entry point for the Bundlephobia API client.
 *
 * @example
 * ```typescript
 * import { BundlephobiaClient } from 'bundlephobia-api-client';
 *
 * const client = new BundlephobiaClient();
 *
 * // Get bundle size for the latest version
 * const size = await client.package('react');
 *
 * // Get bundle size for a specific version
 * const size18 = await client.package('react').size('18.2.0');
 *
 * // Get size history across all versions
 * const history = await client.package('react').history();
 *
 * // Get similar/alternative packages
 * const similar = await client.package('react').similar();
 * ```
 */
export class BundlephobiaClient {
  private readonly baseUrl: string;
  private readonly listeners: Map<
    keyof BundlephobiaClientEvents,
    BundlephobiaClientEvents[keyof BundlephobiaClientEvents][]
  > = new Map();

  constructor(options: BundlephobiaClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  /**
   * Subscribes to a client event.
   *
   * @example
   * ```typescript
   * client.on('request', (event) => {
   *   console.log(`${event.method} ${event.url} — ${event.durationMs}ms`);
   *   if (event.error) console.error('Request failed:', event.error);
   * });
   * ```
   */
  on<K extends keyof BundlephobiaClientEvents>(event: K, callback: BundlephobiaClientEvents[K]): this {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
    return this;
  }

  private emit<K extends keyof BundlephobiaClientEvents>(
    event: K,
    payload: Parameters<BundlephobiaClientEvents[K]>[0],
  ): void {
    const callbacks = this.listeners.get(event) ?? [];
    for (const cb of callbacks) {
      (cb as (p: typeof payload) => void)(payload);
    }
  }

  /**
   * Performs a GET request to the Bundlephobia API.
   *
   * @param path - Path to append to the base URL
   * @param params - Optional query parameters
   * @param signal - Optional `AbortSignal` to cancel the request
   * @internal
   */
  async request<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = buildUrl(`${this.baseUrl}${path}`, params);
    const startedAt = new Date();
    let statusCode: number | undefined;
    try {
      const response = await fetch(url, { signal });
      statusCode = response.status;
      if (!response.ok) {
        throw new BundlephobiaApiError(response.status, response.statusText);
      }
      const data = await response.json() as T;
      this.emit('request', {
        url,
        method: 'GET',
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        statusCode,
      });
      return data;
    } catch (err) {
      const finishedAt = new Date();
      this.emit('request', {
        url,
        method: 'GET',
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        statusCode,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Returns a {@link PackageResource} for a given package name, providing access
   * to bundle size, version history, and similar packages.
   *
   * The returned resource can be awaited directly to fetch the bundle size for
   * the latest version, or chained to access specific methods.
   *
   * @param name - The package name (e.g. `'react'`, `'@types/node'`)
   * @returns A chainable package resource
   *
   * @example
   * ```typescript
   * const size    = await client.package('react');
   * const size18  = await client.package('react').size('18.2.0');
   * const history = await client.package('react').history();
   * const similar = await client.package('react').similar();
   * ```
   */
  package(name: string): PackageResource {
    return new PackageResource(
      <T>(path: string, params?: Record<string, string | number | boolean>, signal?: AbortSignal) =>
        this.request<T>(path, params, signal),
      name,
    );
  }
}

/**
 * Appends query parameters to a URL string, skipping `undefined` values.
 * @internal
 */
function buildUrl(base: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return base;
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return base;
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `${base}?${search.toString()}`;
}
