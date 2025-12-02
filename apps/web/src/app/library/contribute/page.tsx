import Link from 'next/link';
import { ArrowLeft, Award, Shield, Zap } from 'lucide-react';
import { ContributeForm } from '@/components/library/ContributeForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contribute Resource | Apex Commons',
  description: 'Share your educational resources with the community and earn reputation credits.',
};

export default function ContributePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="px-6 py-12 border-b border-cyan-500/20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            <span className="text-white">Contribute a</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Resource
            </span>
          </h1>

          <p className="text-slate-400 mb-6">
            Share your educational materials with teachers worldwide.
            Quality resources help build a stronger teaching community.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-900/30 border border-cyan-500/20">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Earn RC</h3>
                <p className="text-sm text-slate-400">
                  Get 20 reputation credits when your resource is approved
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-900/30 border border-purple-500/20">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Build Reputation</h3>
                <p className="text-sm text-slate-400">
                  Earn more when others upvote and download your content
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-900/30 border border-cyan-500/20">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Quality Reviewed</h3>
                <p className="text-sm text-slate-400">
                  Moderators ensure all resources meet quality standards
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 py-12">
        <ContributeForm />
      </section>
    </div>
  );
}
