// lib/routeMap.ts
export type ContentKind = 'blog' | 'intel' | 'research';

export interface ContentItem {
  kind: ContentKind;   // source collection/category
  slug: string;        // URL-safe slug
}

export function hrefForItem(item: ContentItem): string {
  switch (item.kind) {
    case 'blog': return `/blog/${item.slug}`;
    case 'intel': return `/intel/${item.slug}`;
    case 'research': return `/research/${item.slug}`;
    default: return '/';
  }
}
