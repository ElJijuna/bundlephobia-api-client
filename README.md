# bundlephobia-api-client

[![CI](https://github.com/ElJijuna/bundlephobia-api-client/actions/workflows/ci.yml/badge.svg)](https://github.com/ElJijuna/bundlephobia-api-client/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/bundlephobia-api-client)](https://www.npmjs.com/package/bundlephobia-api-client)
[![npm downloads/week](https://img.shields.io/npm/dw/bundlephobia-api-client)](https://www.npmjs.com/package/bundlephobia-api-client)
[![npm downloads/month](https://img.shields.io/npm/dm/bundlephobia-api-client)](https://www.npmjs.com/package/bundlephobia-api-client)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/bundlephobia-api-client)](https://bundlephobia.com/package/bundlephobia-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

TypeScript client for the [Bundlephobia](https://bundlephobia.com) public API.
Works in **Node.js** and the **browser** (isomorphic). Fully typed, zero runtime dependencies.

---

## Installation

```bash
npm install bundlephobia-api-client
```

---

## Quick start

```typescript
import { BundlephobiaClient } from 'bundlephobia-api-client';

const client = new BundlephobiaClient();

// Bundle size for the latest version (await directly)
const size = await client.package('react');
console.log(size.gzip); // 2670

// Bundle size for a specific version
const size18 = await client.package('react').size('18.2.0');

// Size history across all versions
const history = await client.package('react').history();

// Similar / alternative packages
const similar = await client.package('react').similar();
```

---

## API reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `client.package(name)` | — | Returns a chainable `PackageResource` |
| `client.package(name).size(version?, signal?)` | `GET /api/size?package={name}@{version}` | Bundle size for a specific version (default: latest) |
| `client.package(name).history(signal?)` | `GET /api/package-history?package={name}` | Size history across all published versions |
| `client.package(name).similar(signal?)` | `GET /api/similar-packages?package={name}` | Similar/alternative packages with bundle sizes |

---

### Bundle size

```typescript
// Latest version — await the resource directly
const size = await client.package('react');

// Or call .size() explicitly
const size = await client.package('react').size();

// Specific version
const size18 = await client.package('react').size('18.2.0');

console.log(size18.name);            // 'react'
console.log(size18.version);         // '18.2.0'
console.log(size18.size);            // 6457   (minified, bytes)
console.log(size18.gzip);            // 2670   (gzip, bytes)
console.log(size18.dependencyCount); // 2
console.log(size18.hasSideEffects);  // false

// Per-dependency size breakdown
size18.dependencySizes.forEach(d => {
  console.log(`${d.name}: ~${d.approximateSize}B`);
});
```

### Size history

```typescript
const history = await client.package('react').history();

// history is a Record<version, { size, gzip }>
for (const [version, entry] of Object.entries(history)) {
  console.log(`${version} — ${entry.size}B (${entry.gzip}B gzip)`);
}
```

### Similar packages

```typescript
const similar = await client.package('react').similar();

similar.alternativePackages.forEach(p => {
  console.log(`${p.name}@${p.version} — ${p.gzip}B gzip`);
});
```

---

## Chainable resource pattern

`PackageResource` implements `PromiseLike<BundleSize>`, so you can **await it directly** to fetch the latest bundle size or **chain methods** for specific queries:

```typescript
// Await directly → latest version bundle size
const size = await client.package('react');

// Chain → specific version
const size18 = await client.package('react').size('18.2.0');

// Chain → history
const history = await client.package('react').history();
```

---

## Cancelling requests

Pass an `AbortSignal` to any method to cancel the in-flight request:

```typescript
const controller = new AbortController();

setTimeout(() => controller.abort(), 3000);

const size    = await client.package('react').size(undefined, controller.signal);
const history = await client.package('react').history(controller.signal);
const similar = await client.package('react').similar(controller.signal);
```

When a request is aborted, `fetch` throws a `DOMException` with `name === 'AbortError'`.
The `request` event is still emitted with the error attached.

---

## Request events

Subscribe to every HTTP request for logging, monitoring, or debugging:

```typescript
client.on('request', (event) => {
  console.log(`[${event.method}] ${event.url} → ${event.statusCode} (${event.durationMs}ms)`);
  if (event.error) {
    console.error('Request failed:', event.error.message);
  }
});
```

The `event` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `url` | `string` | Full URL that was requested |
| `method` | `'GET'` | HTTP method used |
| `startedAt` | `Date` | When the request started |
| `finishedAt` | `Date` | When the request finished |
| `durationMs` | `number` | Duration in milliseconds |
| `statusCode` | `number \| undefined` | HTTP status code, if a response was received |
| `error` | `Error \| undefined` | Present only if the request failed |

Multiple listeners can be registered. The event is always emitted after the request completes, whether it succeeded or failed.

---

## Error handling

Non-2xx responses throw a `BundlephobiaApiError` with the HTTP status code and status text:

```typescript
import { BundlephobiaApiError } from 'bundlephobia-api-client';

try {
  await client.package('nonexistent-xyz').size();
} catch (err) {
  if (err instanceof BundlephobiaApiError) {
    console.log(err.status);     // 404
    console.log(err.statusText); // 'Not Found'
    console.log(err.message);    // 'Bundlephobia API error: 404 Not Found'
  }
}
```

---

## TypeScript types

All domain types are exported:

```typescript
import type {
  // Client
  BundlephobiaClientOptions, RequestEvent, BundlephobiaClientEvents,
  // Bundle size
  BundleSize, BundleAsset, DependencySize,
  // History
  PackageHistory, HistoryEntry,
  // Similar packages
  SimilarPackages, SimilarPackage,
} from 'bundlephobia-api-client';
```

---

## Documentation

Full API documentation is published at:
**[https://eljijuna.github.io/bundlephobia-api-client](https://eljijuna.github.io/bundlephobia-api-client)**

---

## License

[MIT](LICENSE)
