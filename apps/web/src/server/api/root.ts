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
import { resourcesRouter } from './routers/resourcesRouter';
import { insightsRouter } from './routers/insights';

export const appRouter = router({
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
  apexCommons: apexCommonsRouter,
  resources: resourcesRouter,
  insights: insightsRouter,
});

export type AppRouter = typeof appRouter;


