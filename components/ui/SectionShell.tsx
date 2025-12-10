import type { ReactNode } from 'react';

type SectionShellProps = {
  title: string;
  subtitle?: string;
  fullWidth?: boolean;
  children: ReactNode;
};

export function SectionShell({
  title,
  subtitle,
  fullWidth = false,
  children,
}: SectionShellProps) {
  return (
    <div className={`p-6 md:p-8 ${fullWidth ? '' : 'max-w-6xl mx-auto'}`}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-slate-400 md:text-base">{subtitle}</p>
        )}
      </header>
      {children}
    </div>
  );
}
