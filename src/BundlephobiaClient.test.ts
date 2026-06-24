import type { BundleSize, PackageHistory, SimilarPackages } from './index';
import { BundlephobiaApiError, BundlephobiaClient } from './index';

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

const mockPackageHistory: PackageHistory = {
  '17.0.0': { size: 5982, gzip: 2488 },
  '18.2.0': { size: 6457, gzip: 2670 },
};
const mockSimilarPackages: SimilarPackages = {
  alternativePackages: [
    {
      name: 'preact',
      version: '10.11.0',
      description: 'Fast 3kb React-compatible Virtual DOM library.',
      size: 4335,
      gzip: 1987,
    },
  ],
};
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

    it('resolves bundle size for latest version via .size()', async () => {
      mockResponse(mockBundleSize);
      const result = await client.package('react').size();

      expect(result.name).toBe('react');
      expect(result.gzip).toBe(2670);
    });

    it('resolves bundle size for a specific version via .size(version)', async () => {
      mockResponse(mockBundleSize);
      await client.package('react').size('18.2.0');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('package=react%4018.2.0'),
        expect.any(Object),
      );
    });

    it('encodes scoped package names correctly', async () => {
      mockResponse(mockBundleSize);
      await client.package('@types/node').size();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('package=%40types%2Fnode'),
        expect.any(Object),
      );
    });

    it('encodes scoped package names with version correctly', async () => {
      mockResponse(mockBundleSize);
      await client.package('@types/node').size('20.0.0');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('package=%40types%2Fnode%4020.0.0'),
        expect.any(Object),
      );
    });

    describe('history()', () => {
      it('returns package history', async () => {
        mockResponse(mockPackageHistory);
        const result = await client.package('react').history();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/package-history'),
          expect.any(Object),
        );
        expect(result['18.2.0'].gzip).toBe(2670);
      });

      it('passes signal to fetch', async () => {
        mockResponse(mockPackageHistory);
        const controller = new AbortController();

        await client.package('react').history(controller.signal);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ signal: controller.signal }),
        );
      });
    });

    describe('similar()', () => {
      it('returns similar packages', async () => {
        mockResponse(mockSimilarPackages);
        const result = await client.package('react').similar();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/similar-packages'),
          expect.any(Object),
        );
        expect(result.alternativePackages[0].name).toBe('preact');
      });

      it('passes signal to fetch', async () => {
        mockResponse(mockSimilarPackages);
        const controller = new AbortController();

        await client.package('react').similar(controller.signal);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ signal: controller.signal }),
        );
      });
    });
  });

  describe('request()', () => {
    it('builds URL without query string when no params are provided', async () => {
      mockResponse({});
      await client.request('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://bundlephobia.com/api/test',
        expect.any(Object),
      );
    });

    it('builds URL without query string when params object is empty', async () => {
      mockResponse({});
      await client.request('/api/test', {});

      expect(mockFetch).toHaveBeenCalledWith(
        'https://bundlephobia.com/api/test',
        expect.any(Object),
      );
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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });
      const events: unknown[] = [];

      client.on('request', (e) => events.push(e));
      await expect(client.package('nonexistent-xyz').size()).rejects.toThrow(BundlephobiaApiError);
      expect(events).toHaveLength(1);
      const event = events[0] as { error: Error };

      expect(event.error).toBeInstanceOf(BundlephobiaApiError);
    });

    it('notifies multiple listeners registered for the same event', async () => {
      mockResponse(mockBundleSize);
      const firstEvents: unknown[] = [];
      const secondEvents: unknown[] = [];

      client.on('request', (e) => firstEvents.push(e));
      client.on('request', (e) => secondEvents.push(e));
      await client.package('react').size();

      expect(firstEvents).toHaveLength(1);
      expect(secondEvents).toHaveLength(1);
    });

    it('does not throw when no listeners are registered', async () => {
      mockResponse(mockBundleSize);

      await expect(client.package('react').size()).resolves.toBeDefined();
    });

    it('supports method chaining', () => {
      const result = client.on('request', () => undefined);

      expect(result).toBe(client);
    });
  });

  describe('BundlephobiaApiError', () => {
    it('throws BundlephobiaApiError on non-2xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });
      await expect(client.package('nonexistent-xyz').size()).rejects.toThrow(BundlephobiaApiError);
    });

    it('includes status and statusText on the error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });

      try {
        await client.package('nonexistent-xyz').size();
      } catch (err) {
        expect(err).toBeInstanceOf(BundlephobiaApiError);
        expect((err as BundlephobiaApiError).status).toBe(404);
        expect((err as BundlephobiaApiError).statusText).toBe('Not Found');
      }
    });

    it('has a descriptive error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn(),
      });

      await expect(client.package('nonexistent-xyz').size()).rejects.toThrow(
        'Bundlephobia API error: 404 Not Found',
      );
    });

    it('has the correct error name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn(),
      });

      try {
        await client.package('react').size();
      } catch (err) {
        expect((err as BundlephobiaApiError).name).toBe('BundlephobiaApiError');
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
      await expect(client.package('react').size(undefined, controller.signal)).rejects.toThrow(
        'The operation was aborted.',
      );
      expect(events).toHaveLength(1);
      const event = events[0] as { error: Error };

      expect(event.error.message).toContain('The operation was aborted.');
    });
  });
});
