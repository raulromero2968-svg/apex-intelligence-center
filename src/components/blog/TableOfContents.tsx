import GithubSlugger from 'github-slugger';

type TableOfContentsProps = {
  content: string;
};

type Heading = {
  id: string;
  text: string;
  level: number;
};

const headingRegex = /^(#{2,4})\s+(.+)$/gm;

function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const matches: Heading[] = [];
  const seenIds = new Set<string>();

  for (const match of markdown.matchAll(headingRegex)) {
    const [_, hashes, rawText] = match;
    const level = hashes.length;
    const text = rawText.trim().replace(/#+$/, '').trim();
    let id = slugger.slug(text);

    // github-slugger already ensures uniqueness, but double‑check for safety
    if (seenIds.has(id)) {
      let suffix = 1;
      while (seenIds.has(`${id}-${suffix}`)) {
        suffix += 1;
      }
      id = `${id}-${suffix}`;
    }

    seenIds.add(id);
    matches.push({ id, text, level });
  }

  return matches;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  if (!content) {
    return null;
  }

  const headings = extractHeadings(content);
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6 text-sm backdrop-blur"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
        On this page
      </p>
      <ul className="mt-4 space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level > 2 ? 'ml-4 text-white/60' : 'text-white/80'}
          >
            <a
              href={`#${heading.id}`}
              className="block rounded px-2 py-1 text-sm transition-colors hover:text-cyan-300"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
