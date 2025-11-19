import type { MetadataRoute } from "next";
import { allPosts } from "contentlayer/generated";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://apexintelligence.io";
  const now = new Date();

  const staticRoutes = ["/", "/blog", "/ai/meta", "/press", "/legal/licensing", "/legal/terms", "/legal/privacy"];

  const statics = staticRoutes.map((route) => ({
    url: `${base}${route === "/" ? "" : route}`,
    lastModified: now,
  }));

  const posts = allPosts
    .filter((post) => !post.draft && !post.unlisted)
    .map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : now,
    }));

  return [...statics, ...posts];
}
