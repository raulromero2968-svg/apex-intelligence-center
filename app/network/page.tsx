import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { powerEntities, powerRelationships } from '@apex/db/src/schema/powerNetwork';
import { NetworkPageClient } from './NetworkPageClient';

// Force dynamic rendering so we get fresh data
export const dynamic = 'force-dynamic';

// Server component - fetches data from the database
async function getNetworkData() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const db = drizzle(pool);

  try {
    // Fetch all entities and relationships
    const allNodes = await db.select().from(powerEntities);
    const allLinks = await db.select().from(powerRelationships);

    await pool.end();

    return {
      nodes: allNodes.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        evidenceTier: n.evidenceTier,
        isObfuscated: n.isObfuscated ?? false,
        scandalNotes: n.scandalNotes,
        primaryDomain: n.primaryDomain,
      })),
      links: allLinks.map((l) => ({
        source: l.sourceId,
        target: l.targetId,
        relationshipType: l.relationshipType,
        domain: l.domain,
        evidenceTier: l.evidenceTier,
        description: l.description,
        significance: l.significance,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch network data:', error);
    await pool.end();
    // Return empty data on error
    return { nodes: [], links: [] };
  }
}

export default async function NetworkPage() {
  const graphData = await getNetworkData();

  const nodeCount = graphData.nodes.length;
  const linkCount = graphData.links.length;
  const solutionCount = graphData.nodes.filter((n) => n.type === 'SOLUTION').length;
  const organizationCount = graphData.nodes.filter(
    (n) => n.type === 'ORGANIZATION' && n.scandalNotes?.includes('SOLUTION')
  ).length;

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            The Architecture of Power
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Mapping the connections between{' '}
            <span className="text-red-500 font-mono">Tier 1 Elites</span>,{' '}
            <span className="text-purple-500 font-mono">Systemic Forces</span>, and{' '}
            <span className="text-green-500 font-mono">Verified Solutions</span>.
          </p>
        </div>

        {/* The Network Graph */}
        <NetworkPageClient data={graphData} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center text-sm text-slate-400 mt-8">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="block font-bold text-cyan-400 text-xl">{nodeCount}</span>
            Entities Mapped
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="block font-bold text-cyan-400 text-xl">{linkCount}</span>
            Verified Connections
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="block font-bold text-green-500 text-xl">
              {solutionCount}
            </span>
            Active Solutions
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="block font-bold text-green-500 text-xl">
              {organizationCount}
            </span>
            Solution Organizations
          </div>
        </div>

        {/* Philosophy Note */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700">
          <h2 className="text-xl font-bold text-slate-200 mb-3">
            The Luminous Jellyfish Principle
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            A graph that only maps corruption is a map of despair. By adding{' '}
            <span className="text-green-400 font-semibold">Solution nodes</span> to the
            same database as scandal-linked entities, we create something radical: a
            unified view of both the problem and the path forward. The{' '}
            <span className="text-green-400">green nodes</span> (Catch-Up Clubs, Fair
            Cobalt Alliance) connect to the same material reality (Cobalt) but offer a
            path <em>away</em> from exploitation. This is the Architecture of Hope.
          </p>
        </div>
      </div>
    </div>
  );
}
