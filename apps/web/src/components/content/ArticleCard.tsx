import Link from "next/link";

type Article = {
  href: string;
  title: string;
  excerpt: string;
  date: string;          // ISO date
  read: string;          // "10 min read"
  tags?: string[];
  badge?: "PRO" | "PREMIUM";
};

export default function ArticleCard({ a }: { a: Article }) {
  return (
    <article className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition
                        hover:border-cyan-400/40 hover:bg-white/[0.07]">
      <div className="mb-2 text-xs text-cyan-300/80">
        {new Date(a.date).toLocaleDateString('en-US', { month: "long", day: "numeric", year: "numeric"})}
        {" · "}{a.read}
      </div>

      <Link href={a.href} className="block">
        <h3 className="text-xl font-semibold leading-snug group-hover:text-white">
          {a.title} {a.badge && (
            <span className="ml-2 align-middle rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2 py-0.5 text-[10px]">
              {a.badge}
            </span>
          )}
        </h3>
        <p className="mt-2 text-sm text-white/70 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
          {a.excerpt}
        </p>
      </Link>

      {a.tags && a.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {a.tags.map(t => (
            <li key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">{t}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

