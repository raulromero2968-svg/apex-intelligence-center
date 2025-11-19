interface Source {
  name: string;
  url: string;
  publisher?: string;
  accessed?: string;
  description?: string;
}

interface SourceCardsProps {
  sources?: Source[];
}

export default function SourceCards({ sources = [] }: SourceCardsProps) {
  if (!sources.length) return null;

  return (
    <div className="my-6 grid gap-4 md:grid-cols-2">
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border border-cyan-500/20 bg-black/40 p-4 transition hover:border-cyan-400/60 hover:bg-black/60"
        >
          <p className="text-sm text-white/70">{source.publisher || 'Source'}</p>
          <h4 className="mt-1 text-base font-semibold text-white group-hover:text-cyan-300">
            {source.name}
          </h4>
          {source.accessed && (
            <p className="mt-2 text-xs text-white/50">Verified {source.accessed}</p>
          )}
        </a>
      ))}
    </div>
  );
}

