# Roadmap

## Legend
- ✅ Implemented
- ⬜ Pending

---

## BundlephobiaClient (entry point)

| Method | Endpoint | Status |
|--------|----------|--------|
| `package(name)` | — chainable | ⬜ |
| AbortSignal support on all methods | — | ⬜ |
| `on('request', cb)` event listener | — | ⬜ |

---

## PackageResource

| Method | Endpoint | Status |
|--------|----------|--------|
| `size(version?, signal?)` | `GET /api/size?package={name}@{version}` | ⬜ |
| `history(signal?)` | `GET /api/package-history?package={name}` | ⬜ |
| `similar(signal?)` | `GET /api/similar-packages?package={name}` | ⬜ |

---

## Domain Types

| Type | Description | Status |
|------|-------------|--------|
| `BundleSize` | Response shape for `/api/size` | ⬜ |
| `BundleAsset` | Individual asset entry within a size response | ⬜ |
| `DependencySize` | Per-dependency size entry | ⬜ |
| `PackageHistory` | Response shape for `/api/package-history` | ⬜ |
| `HistoryEntry` | Per-version entry in history | ⬜ |
| `SimilarPackages` | Response shape for `/api/similar-packages` | ⬜ |

---

## Infra & Tooling

| Item | Status |
|------|--------|
| TypeScript + tsup build | ⬜ |
| Jest unit tests | ⬜ |
| GitHub Actions CI | ⬜ |
| Semantic Release | ⬜ |
| TypeDoc documentation | ⬜ |
