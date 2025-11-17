declare module '@sentry/nextjs' {
  const sentry: any;
  export = sentry;
}

declare module '@/lib/redis' {
  const redis: any;
  export = redis;
}

declare module '@upstash/redis' {
  export class Redis {
    constructor(options: Record<string, unknown>);
  }
}

