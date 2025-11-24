'use client';

import { useState, useEffect } from 'react';

export function TerminalStream({ content, speed = 5 }: { content: string, speed?: number }) {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    setDisplayedContent(''); // Reset on content change
    let i = 0;
    const timer = setInterval(() => {
      if (i < content.length) {
        setDisplayedContent((prev) => prev + content.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [content, speed]);

  return (
    <span className="font-mono text-slate-300 leading-relaxed">
      {displayedContent}
      <span className="animate-pulse inline-block w-2 h-4 bg-cyan-500 ml-1 align-middle"></span>
    </span>
  );
}
