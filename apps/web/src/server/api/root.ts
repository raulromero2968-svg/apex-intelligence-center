import { router } from '../api/init';
import { varcRouter } from './routers/varc';
import { lampRouter } from './routers/lamp';
import { contrarianRouter } from './routers/contrarian';
import { forensicsRouter } from './routers/forensics';
import { jobsRouter } from './routers/jobs';
import { blockchainRouter } from './routers/blockchain';
import { arbitrageRouter } from './routers/arbitrage';
import { convergenceRouter } from './routers/convergence';
import { vaultRouter } from './routers/vault';
import { projectORouter } from './routers/projectO';
import { apexCommonsRouter } from './routers/apexCommons';
// Backend Triad: Specialized routers for the Apex Commons ecosystem
import { reputationRouter } from './routers/reputation';
import { governanceRouter } from './routers/governance';

/**
 * APEX INTELLIGENCE CENTER - ROOT ROUTER
 * ========================================
 * The Central Nervous System that exposes all API endpoints to the client.
 *
 * Backend Triad:
 * - resources (via apexCommons) - Content Core for educational materials
 * - reputation - The Moral Engine for RC economy and contributor levels
 * - governance - The Community Brain for democratic decision-making
 */
export const appRouter = router({
  // Core platform routers
  varc: varcRouter,
  lamp: lampRouter,
  contrarian: contrarianRouter,
  forensics: forensicsRouter,
  jobs: jobsRouter,
  blockchain: blockchainRouter,
  arbitrage: arbitrageRouter,
  convergence: convergenceRouter,
  vault: vaultRouter,
  projectO: projectORouter,

  // Apex Commons - The Content Core (resources, collections, moderation)
  apexCommons: apexCommonsRouter,

  // Backend Triad - Specialized subsystems
  reputation: reputationRouter,  // The Moral Engine
  governance: governanceRouter,  // The Community Brain
});

export type AppRouter = typeof appRouter;


