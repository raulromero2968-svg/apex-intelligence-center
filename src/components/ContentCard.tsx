// components/ContentCard.tsx
'use client';

import Link from 'next/link';
import { hrefForItem, ContentItem } from '@/lib/routeMap';

type Props = ContentItem & {
  title: string;
  excerpt?: string;
  dateISO?: string;
  badge?: string; // e.g. "Blog"
};

export default function ContentCard(props: Props) {
  const href = hrefForItem(props);
  return (
    <Link href={href} className="block group rounded-xl border border-white/10 p-4 hover:border-white/20 transition">
      <div className="text-xs opacity-70 mb-1">{props.badge ?? props.kind}</div>
      <h3 className="text-lg font-semibold leading-snug group-hover:underline">{props.title}</h3>
      {props.excerpt && <p className="text-sm opacity-80 mt-2 line-clamp-3">{props.excerpt}</p>}
      {props.dateISO && <time className="text-xs opacity-60 mt-3 block" dateTime={props.dateISO}>
        {new Date(props.dateISO).toLocaleDateString()}
      </time>}
    </Link>
  );
}
