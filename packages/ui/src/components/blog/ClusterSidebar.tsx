/**
 * ClusterSidebar - Topic Cluster Navigation
 *
 * A navigation component for SEO "Topic Clusters" strategy. Displays as a
 * sticky sidebar on desktop and a collapsible panel on mobile. Helps users
 * (and crawlers) navigate between Pillar Pages and Cluster Content.
 *
 * @module @apex/ui/components/blog
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface ClusterLink {
  /** Display title of the link */
  title: string;
  /** URL slug for the link */
  slug: string;
  /** Whether this link is currently active */
  isActive: boolean;
}

export interface ClusterSidebarProps {
  /** Title of the topic cluster */
  title: string;
  /** Array of links in the cluster */
  links: ClusterLink[];
  /** Optional className for the container */
  className?: string;
  /** Base path for link generation (e.g., "/blog") */
  basePath?: string;
  /** Custom link component for framework integration (e.g., Next.js Link) */
  LinkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
}

/**
 * Chevron icon for mobile expand/collapse
 */
function ChevronIcon({ className, isOpen }: { className?: string; isOpen: boolean }) {
  return (
    <svg
      className={cn(
        "w-4 h-4 transition-transform duration-200",
        isOpen && "rotate-180",
        className
      )}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Default link component (standard <a> tag)
 */
function DefaultLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function ClusterSidebar({
  title,
  links,
  className,
  basePath = "/blog",
  LinkComponent = DefaultLink,
}: ClusterSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active items for accessibility
  const activeIndex = links.findIndex((link) => link.isActive);

  return (
    <nav
      className={cn(
        // Base styles
        "w-full",
        // Desktop: sticky sidebar
        "lg:sticky lg:top-6",
        "lg:max-w-[260px]",
        className
      )}
      aria-label={`${title} navigation`}
    >
      {/* Desktop View */}
      <div className="hidden lg:block">
        <div
          className={cn(
            "p-4",
            "bg-space-void/80 backdrop-blur-sm",
            "border border-slate-700/30",
            "rounded-lg"
          )}
        >
          {/* Title */}
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {title}
          </h4>

          {/* Links */}
          <ul className="space-y-1" role="list">
            {links.map((link, index) => (
              <li key={link.slug}>
                <LinkComponent
                  href={`${basePath}/${link.slug}`}
                  className={cn(
                    "block",
                    "px-3 py-2",
                    "text-sm",
                    "rounded-md",
                    "transition-all duration-150",
                    link.isActive
                      ? [
                          "text-cyan-400 font-medium",
                          "bg-cyan-400/10",
                          "border-l-2 border-cyan-400",
                          "pl-[10px]", // Adjust for border
                        ]
                      : [
                          "text-slate-400 hover:text-slate-200",
                          "hover:bg-slate-800/50",
                          "border-l-2 border-transparent",
                          "pl-[10px]",
                        ]
                  )}
                  aria-current={link.isActive ? "page" : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        link.isActive ? "bg-cyan-400" : "bg-slate-600"
                      )}
                    />
                    <span className="truncate">{link.title}</span>
                  </span>
                </LinkComponent>
              </li>
            ))}
          </ul>

          {/* Progress indicator */}
          {activeIndex >= 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/50">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                <span>Progress</span>
                <span className="font-mono">
                  {activeIndex + 1} / {links.length}
                </span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${((activeIndex + 1) / links.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile View - Collapsible Details */}
      <div className="lg:hidden">
        <details
          className={cn(
            "group",
            "bg-space-void/80 backdrop-blur-sm",
            "border border-slate-700/30",
            "rounded-lg",
            "overflow-hidden"
          )}
          open={isOpen}
          onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary
            className={cn(
              "flex items-center justify-between",
              "px-4 py-3",
              "cursor-pointer",
              "select-none",
              "list-none", // Remove default marker
              "[&::-webkit-details-marker]:hidden" // Safari
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {title}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({links.length})
              </span>
            </div>
            <ChevronIcon isOpen={isOpen} className="text-slate-400" />
          </summary>

          <div className="px-4 pb-4">
            <ul className="space-y-1" role="list">
              {links.map((link) => (
                <li key={link.slug}>
                  <LinkComponent
                    href={`${basePath}/${link.slug}`}
                    className={cn(
                      "block",
                      "px-3 py-2",
                      "text-sm",
                      "rounded-md",
                      "transition-all duration-150",
                      link.isActive
                        ? [
                            "text-cyan-400 font-medium",
                            "bg-cyan-400/10",
                          ]
                        : [
                            "text-slate-400 hover:text-slate-200",
                            "hover:bg-slate-800/50",
                          ]
                    )}
                    aria-current={link.isActive ? "page" : undefined}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          link.isActive ? "bg-cyan-400" : "bg-slate-600"
                        )}
                      />
                      <span className="truncate">{link.title}</span>
                    </span>
                  </LinkComponent>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </nav>
  );
}

export default ClusterSidebar;
