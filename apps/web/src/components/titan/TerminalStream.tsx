"use client";

import React, { useState, useEffect } from "react";

interface TerminalStreamProps {
  lines: string[];
  typingSpeed?: number;
  className?: string;
}

export const TerminalStream: React.FC<TerminalStreamProps> = ({
  lines,
  typingSpeed = 30,
  className = "",
}) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    if (currentLineIndex >= lines.length) return;

    const currentLine = lines[currentLineIndex];

    if (currentCharIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          if (newLines[currentLineIndex] === undefined) {
            newLines[currentLineIndex] = "";
          }
          newLines[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1);
          return newLines;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else {
      // Move to next line after a brief pause
      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, currentCharIndex, lines, typingSpeed]);

  return (
    <div className={`font-mono whitespace-pre-wrap ${className}`}>
      {displayedLines.map((line, index) => (
        <div key={index} className="leading-relaxed">
          {line}
          {index === currentLineIndex && currentCharIndex < lines[currentLineIndex]?.length && (
            <span className="animate-pulse">▊</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TerminalStream;
