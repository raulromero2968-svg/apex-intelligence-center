'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract all h2 and h3 headings from the document
    const elements = document.querySelectorAll('h2, h3');
    const headingData: Heading[] = Array.from(elements).map((elem) => ({
      id: elem.id,
      text: elem.textContent || '',
      level: parseInt(elem.tagName.charAt(1))
    }));
    setHeadings(headingData);

    // Set up IntersectionObserver to track visible headings
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
        threshold: 1.0
      }
    );

    // Observe all headings
    elements.forEach((elem) => observer.observe(elem));

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block fixed top-24 right-8 w-64 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="rounded-xl border border-cyan-500/20 bg-black/40 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <List className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Table of Contents</h3>
        </div>
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={heading.level === 3 ? 'pl-4' : ''}
            >
              <a
                href={`#${heading.id}`}
                className={`
                  block text-sm transition-colors py-1
                  ${activeId === heading.id
                    ? 'text-cyan-400 font-medium'
                    : 'text-white/60 hover:text-white/90'
                  }
                `}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({
                    behavior: 'smooth'
                  });
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

