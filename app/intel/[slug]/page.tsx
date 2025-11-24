import { notFound } from 'next/navigation';
import { IntelHeader } from '@/components/intel/IntelHeader';
import { IntelBody } from '@/components/intel/IntelBody';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';

interface IntelPageProps {
  params: {
    slug: string;
  };
}

// Generate static params for all intel reports
export async function generateStaticParams() {
  return INTEL_ARCHIVE.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: IntelPageProps) {
  const article = INTEL_ARCHIVE.find((a) => a.slug === params.slug);

  if (!article) {
    return {
      title: 'Report Not Found',
    };
  }

  return {
    title: `${article.title} | Apex Intelligence`,
    description: article.summary,
  };
}

// Color mapping for Elite tier
const colorMap: Record<string, "cyan" | "purple" | "amber"> = {
  "Elite": "cyan", // Updated from "Whale" to "Elite"
  "Pro": "purple",
  "Free": "amber"
};

export default function IntelReportPage({ params }: IntelPageProps) {
  const article = INTEL_ARCHIVE.find((a) => a.slug === params.slug);

  if (!article) {
    notFound();
  }

  const tier = article.tier || "Free";
  const themeColor = colorMap[tier] || "amber";

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* INTEL HEADER */}
        <IntelHeader
          slug={params.slug}
          title={article.title}
          tier={tier}
        />

        {/* INTEL BODY */}
        <IntelBody slug={params.slug} />
      </div>
    </main>
  );
}
