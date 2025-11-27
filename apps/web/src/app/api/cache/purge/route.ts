import { revalidateTag } from '@/lib/cache';

// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';

/**
 * Cache purge API
 * Requires ADMIN_CACHE_KEY for authentication
 * Body: { tag?: string } to purge by tag
 */
export async function POST(req: Request) {
  const auth = req.headers.get('x-admin-key');
  if (auth !== process.env.ADMIN_CACHE_KEY) {
    return new Response('forbidden', { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { tag } = body as { tag?: string };

  if (!tag) {
    return new Response('missing tag parameter', { status: 400 });
  }

  // Revalidate the tag in Next.js Data Cache
  revalidateTag(tag);

  return Response.json({ purged: tag, ok: true });
}

