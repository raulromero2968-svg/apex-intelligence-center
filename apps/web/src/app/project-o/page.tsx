import OtcOrderBookTable from '@/components/projectO/OtcOrderBookTable';
import WhitelistPriceChart from '@/components/projectO/WhitelistPriceChart';
import DiscordSentimentFeed from '@/components/projectO/DiscordSentimentFeed';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Project O Intelligence | Apex Intelligence',
  description: 'Real-time OTC order book, whitelist price feed, and Discord sentiment for Project O',
};

export default function ProjectOPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Project O Intelligence
          </h1>
          <p className="text-white/60">
            Real-time OTC order book, whitelist price feed, and Discord sentiment analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="lg:col-span-2">
            <WhitelistPriceChart />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <OtcOrderBookTable />
          </div>
          <div>
            <DiscordSentimentFeed />
          </div>
        </div>
      </div>
    </div>
  );
}

