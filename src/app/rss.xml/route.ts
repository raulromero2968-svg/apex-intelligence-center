import { allPosts } from "contentlayer/generated";
import { NextResponse } from "next/server";

const SITE = "https://apexintelligence.io";

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const items = allPosts
    .slice()
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .map(
      (p) => `
      <item>
        <title>${escapeXml(p.title)}</title>
        <link>${SITE}/blog/${p.slug}</link>
        <guid>${SITE}/blog/${p.slug}</guid>
        <description>${escapeXml(p.description || "")}</description>
        <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      </item>
    `,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Apex Intelligence — Insights</title>
      <link>${SITE}/blog</link>
      <description>Updates and research from Apex Intelligence</description>
      ${items}
    </channel>
  </rss>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

