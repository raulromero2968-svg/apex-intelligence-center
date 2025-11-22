// Legacy redirect for old /insights/{slug} URLs
// As a safety net, we 404 these to avoid confusion.
// If you can infer the kind from CMS by slug, you could redirect instead.

import { notFound } from 'next/navigation';

export default async function LegacyInsightsRedirect() {
  // If you have a way to map slug to the correct kind (blog/intel/research),
  // you could redirect like this:
  // const params = await props.params;
  // redirect(`/intel/${params.slug}`);

  // For now, we just 404 to avoid serving incorrect routes
  notFound();
}
