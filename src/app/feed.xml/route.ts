import { getAllArticles } from '@/lib/mdx';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://apexintelligence.io';
  const allArticles = await getAllArticles();

  // Filter out drafts and unlisted posts
  const articles = allArticles
    .filter((post) => !post.frontmatter.draft && !post.frontmatter.unlisted)
    .sort((a, b) => new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime());

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Apex Intelligence – TCG Investment Intelligence</title>
    <link>${baseUrl}</link>
    <description>Real-time market data, investment research, and analytics for trading card games.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${articles
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.frontmatter.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.frontmatter.description || post.frontmatter.tags?.join(', ') || ''}]]></description>
      <pubDate>${new Date(post.frontmatter.publishedAt).toUTCString()}</pubDate>
      <author>${post.frontmatter.author || 'Apex Intelligence Team'}</author>
      ${post.frontmatter.tags ? post.frontmatter.tags.map((tag) => `<category>${tag}</category>`).join('\n      ') : ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  });
}
