import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <FileQuestion className="w-20 h-20 text-slate-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Article Not Found</h1>
        <p className="text-slate-400 mb-8">
          The intelligence report you're looking for doesn't exist or has been archived.
        </p>
        <Link
          href="/intel"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Intelligence Archive
        </Link>
      </div>
    </div>
  );
}
