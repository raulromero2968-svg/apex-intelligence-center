import { ResourceDetail } from '@/components/library/ResourceDetail';

export const dynamic = 'force-dynamic';

interface ResourcePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ResourcePageProps) {
  return {
    title: `Resource | Apex Commons Library`,
    description: 'View and download this educational resource from the Apex Commons Library.',
  };
}

export default function ResourcePage({ params }: ResourcePageProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        <ResourceDetail resourceId={params.id} />
      </div>
    </div>
  );
}
