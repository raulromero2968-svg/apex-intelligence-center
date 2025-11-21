"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/intel", label: "Intel" },
  { href: "/insights", label: "Insights" },
  { href: "/blog", label: "Blog" },
  { href: "/research", label: "Research" },
  { href: "/hall-of-disciples", label: "Hall of Disciples" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
];

export function MainNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Global">
      <ul className="flex gap-2">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={[
                  "rounded-xl px-3 py-2 text-sm transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
                  active
                    ? "bg-cyan-400/10 text-white"
                    : "text-white/80 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/subscribe" className="ml-2 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:brightness-110 transition">
            Subscribe
          </Link>
        </li>
      </ul>
    </nav>
  );
}

