import { BundlephobiaClient } from '../dist/index.js';

const client = new BundlephobiaClient();

async function test() {
  // Bundle size for latest version
  const size = await client.package('react');
  console.log(`react — size: ${size.size}B, gzip: ${size.gzip}B, deps: ${size.dependencyCount}`);

  // Bundle size for a specific version
  const sizeV18 = await client.package('react').size('18.2.0');
  console.log(`react@18.2.0 — size: ${sizeV18.size}B, gzip: ${sizeV18.gzip}B`);

  // Size history across all versions
  const history = await client.package('react').history();
  const versions = Object.keys(history);
  console.log(`react history — ${versions.length} versions (latest: ${versions.at(-1)})`);

  // Similar packages
  const similar = await client.package('react').similar();
  console.log('Similar packages:');
  similar.alternativePackages.forEach(p => console.log(` - ${p.name}@${p.version} (${p.gzip}B gzip)`));
}

test().catch(console.error);
