// lib/ld/article.ts
import type { Article } from "@/lib/mdx";

export function articleLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.frontmatter.title,
    "description": article.frontmatter.tags?.join(', ') || '',
    "datePublished": article.frontmatter.publishedAt,
    "dateModified": article.frontmatter.publishedAt,
    "author": [{ "@type": "Person", "name": "Apex Intelligence" }],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://apexintelligence.io/blog/${article.slug}`
    },
    "image": article.frontmatter.heroImage
      ? [`https://apexintelligence.io${article.frontmatter.heroImage}`]
      : undefined,
    "publisher": {
      "@type": "Organization",
      "name": "Apex Intelligence",
      "logo": {
        "@type": "ImageObject",
        "url": "https://apexintelligence.io/press/og-default.png"
      }
    }
  };
}
