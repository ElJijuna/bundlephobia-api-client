import { BundlephobiaClient, BundlephobiaApiError } from './index';
import type { BundleSize } from './index';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse<T>(data: T, status = 200): void {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Not Found',
    json: () => Promise.resolve(data),
  });
}

const mockBundleSize: BundleSize = {
  name: 'react',
  version: '18.2.0',
  description: 'React is a JavaScript library for building user interfaces.',
  size: 6457,
  gzip: 2670,
  dependencyCount: 2,
  hasSideEffects: false,
  hasJSModule: false,
  hasJSNext: false,
  isModuleType: false,
  scoped: false,
  assets: [],
  dependencySizes: [],
};

describe('BundlephobiaClient', () => {
  let client: BundlephobiaClient;

  beforeEach(() => {
    mockFetch.mockClear();
    client = new BundlephobiaClient();
  });

  describe('constructor', () => {
    it('uses default base URL', () => {
      expect(client).toBeInstanceOf(BundlephobiaClient);
    });

    it('accepts a custom base URL', () => {
      const custom = new BundlephobiaClient({ baseUrl: 'https://my-bundlephobia.example.com' });
      expect(custom).toBeInstanceOf(BundlephobiaClient);
    });

    it('strips trailing slash from baseUrl', async () => {
      const custom = new BundlephobiaClient({ baseUrl: 'https://bundlephobia.com/' });
      mockResponse(mockBundleSize);
      await custom.package('react').size();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/bundlephobia\.com\/api\/size/),
        expect.any(Object),
      );
    });
  });

  describe('package()', () => {
    it('returns a PackageResource', () => {
      const pkg = client.package('react');
      expect(pkg).toBeDefined();
      expect(typeof pkg.size).toBe('function');
      expect(typeof pkg.history).toBe('function');
      expect(typeof pkg.similar).toBe('function');
    });

    it('can be awaited directly (resolves with BundleSize)', async () => {
      mockResponse(mockBundleSize);
      const result = await client.package('react');
      expect(result.name).toBe('react');
      expect(result.gzip).toBe(2670);
    });
  });

  describe('on() event emitter', () => {
    it('emits request event on successful requests', async () => {
      mockResponse(mockBundleSize);
      const events: unknown[] = [];
      client.on('request', (e) => events.push(e));
      await client.package('react').size();
      expect(events).toHaveLength(1);
      const event = events[0] as { url: string; method: string; statusCode: number };
      expect(event.method).toBe('GET');
      expect(event.statusCode).toBe(200);
      expect(event.url).toContain('/api/size');
    });

    it('emits request event with error on failed requests', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: jest.fn() });
      const events: unknown[] = [];
      client.on('request', (e) => events.push(e));
      await expect(client.package('nonexistent-xyz').size()).rejects.toThrow(BundlephobiaApiError);
      expect(events).toHaveLength(1);
      const event = events[0] as { error: Error };
      expect(event.error).toBeInstanceOf(BundlephobiaApiError);
    });

    it('supports method chaining', () => {
      const result = client.on('request', () => undefined);
      expect(result).toBe(client);
    });
  });

  describe('BundlephobiaApiError', () => {
    it('throws BundlephobiaApiError on non-2xx responses', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: jest.fn() });
      await expect(client.package('nonexistent-xyz').size()).rejects.toThrow(BundlephobiaApiError);
    });

    it('includes status and statusText on the error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: jest.fn() });
      try {
        await client.package('nonexistent-xyz').size();
      } catch (err) {
        expect(err).toBeInstanceOf(BundlephobiaApiError);
        expect((err as BundlephobiaApiError).status).toBe(404);
        expect((err as BundlephobiaApiError).statusText).toBe('Not Found');
      }
    });
  });

  describe('AbortSignal', () => {
    it('passes signal to fetch', async () => {
      mockResponse(mockBundleSize);
      const controller = new AbortController();
      await client.package('react').size(undefined, controller.signal);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('propagates AbortError and still emits request event', async () => {
      const abortError = new DOMException('The operation was aborted.', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortError);
      const controller = new AbortController();
      const events: unknown[] = [];
      client.on('request', (e) => events.push(e));
      await expect(client.package('react').size(undefined, controller.signal)).rejects.toThrow('The operation was aborted.');
      expect(events).toHaveLength(1);
      const event = events[0] as { error: Error };
      expect(event.error.message).toContain('The operation was aborted.');
    });
  });
});
