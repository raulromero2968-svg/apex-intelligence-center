declare module '@sentry/nextjs' {
  const sentry: any;
  export = sentry;
}

// Removed: @/lib/redis module declaration - using actual module exports

declare module '@upstash/redis' {
  export class Redis {
    constructor(options: Record<string, unknown>);
  }
}

declare module 'numeric';
declare module '@langchain/textsplitters';
declare module '@langchain/cohere';
declare module '@langchain/voyage';

declare module '@prisma/client' {
  export class PrismaClient {
    constructor(...args: any[]);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    [key: string]: any;
  }
}

declare module 'discord-webhook-node' {
  export class Webhook {
    constructor(...args: any[]);
    setUsername(name: string): void;
    setAvatar(avatarUrl: string): void;
    send(payload: unknown): Promise<void>;
  }
}

declare module 'node-telegram-bot-api' {
  export default class TelegramBot {
    constructor(token: string, options?: Record<string, unknown>);
    sendMessage(chatId: string | number, text: string, options?: Record<string, unknown>): Promise<unknown>;
  }
}

declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string;
    keys?: Record<string, string>;
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(
    subscription: PushSubscription,
    payload?: string,
    options?: Record<string, unknown>
  ): Promise<unknown>;

  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
  };

  export default webpush;
}


