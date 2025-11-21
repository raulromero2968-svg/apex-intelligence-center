import { router } from '../api/init';
import { varcRouter } from './routers/varc';
import { lampRouter } from './routers/lamp';
import { contrarianRouter } from './routers/contrarian';
import { forensicsRouter } from './routers/forensics';
import { jobsRouter } from './routers/jobs';

export const appRouter = router({
  varc: varcRouter,
  lamp: lampRouter,
  contrarian: contrarianRouter,
  forensics: forensicsRouter,
  jobs: jobsRouter,
});

export type AppRouter = typeof appRouter;

