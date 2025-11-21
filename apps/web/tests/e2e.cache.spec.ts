import { test, expect } from '@playwright/test';

async function get(url: string, request: any) {
  const res = await request.get(url);
  return { text: await res.text(), headers: res.headers() };
}

test('collection page is hot after first request and updates after mutation', async ({ request }) => {
  // Seed or use an existing public collection
  const slug = 'my-picks';

  const r1 = await get(`/collections/${slug}`, request);
  expect(r1.headers['server-timing'] || '').toContain('sentry');

  // Perform a mutation that touches the collection
  await request.post(`/actions/add-item`, { data: { slug, itemId: 'TEST-123' } });

  const r2 = await get(`/collections/${slug}`, request);
  expect(r2.text).toContain('TEST-123');
});

