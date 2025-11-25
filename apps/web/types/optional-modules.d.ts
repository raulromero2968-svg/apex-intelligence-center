declare module '@sentry/nextjs' {
  const sentry: any;
  export = sentry;
}

// Removed: @/lib/redis module declaration - using actual module exports

declare module '@upstash/redis' {
  export class Redis {
    constructor(options: Record<string, unknown>);
    get<T = string>(key: string): Promise<T | null>;
    set(key: string, value: unknown, options?: { ex?: number }): Promise<'OK'>;
    del(key: string): Promise<number>;
    publish(channel: string, message: string): Promise<number>;
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

// Fix lucide-react type compatibility with React 18
declare module 'lucide-react' {
  import { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

  export type LucideIcon = ForwardRefExoticComponent<
    SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>
  >;

  export const Twitter: LucideIcon;
  export const Linkedin: LucideIcon;
  export const Instagram: LucideIcon;
  export const Github: LucideIcon;
  export const User: LucideIcon;
  export const Calendar: LucideIcon;
  export const Clock: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const X: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Check: LucideIcon;
  export const Plus: LucideIcon;
  export const Minus: LucideIcon;
  export const Search: LucideIcon;
  export const Settings: LucideIcon;
  export const Home: LucideIcon;
  export const Menu: LucideIcon;
  export const Bell: LucideIcon;
  export const Mail: LucideIcon;
  export const Phone: LucideIcon;
  export const MapPin: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Download: LucideIcon;
  export const Upload: LucideIcon;
  export const Trash2: LucideIcon;
  export const Edit: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Lock: LucideIcon;
  export const Unlock: LucideIcon;
  export const Info: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const Copy: LucideIcon;
  export const Share: LucideIcon;
  export const Share2: LucideIcon;
  export const Bookmark: LucideIcon;
  export const Heart: LucideIcon;
  export const Star: LucideIcon;
  export const Loader2: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Filter: LucideIcon;
  export const SortAsc: LucideIcon;
  export const SortDesc: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Maximize: LucideIcon;
  export const Minimize: LucideIcon;
  export const Play: LucideIcon;
  export const Pause: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const Camera: LucideIcon;
  export const Image: LucideIcon;
  export const FileText: LucideIcon;
  export const File: LucideIcon;
  export const Folder: LucideIcon;
  export const Database: LucideIcon;
  export const Server: LucideIcon;
  export const Cloud: LucideIcon;
  export const Wifi: LucideIcon;
  export const WifiOff: LucideIcon;
  export const Zap: LucideIcon;
  export const Activity: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const BarChart: LucideIcon;
  export const BarChart2: LucideIcon;
  export const PieChart: LucideIcon;
  export const LineChart: LucideIcon;
  export const DollarSign: LucideIcon;
  export const CreditCard: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const Package: LucideIcon;
  export const Truck: LucideIcon;
  export const Users: LucideIcon;
  export const UserPlus: LucideIcon;
  export const UserMinus: LucideIcon;
  export const UserCheck: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Send: LucideIcon;
  export const Inbox: LucideIcon;
  export const Archive: LucideIcon;
  export const Tag: LucideIcon;
  export const Hash: LucideIcon;
  export const AtSign: LucideIcon;
  export const Link: LucideIcon;
  export const Link2: LucideIcon;
  export const Paperclip: LucideIcon;
  export const Layers: LucideIcon;
  export const Layout: LucideIcon;
  export const Grid: LucideIcon;
  export const List: LucideIcon;
  export const Table: LucideIcon;
  export const Columns: LucideIcon;
  export const Sidebar: LucideIcon;
  export const PanelLeft: LucideIcon;
  export const PanelRight: LucideIcon;
  export const Terminal: LucideIcon;
  export const Code: LucideIcon;
  export const Code2: LucideIcon;
  export const Braces: LucideIcon;
  export const Bug: LucideIcon;
  export const Cpu: LucideIcon;
  export const HardDrive: LucideIcon;
  export const Monitor: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Tablet: LucideIcon;
  export const Watch: LucideIcon;
  export const Globe: LucideIcon;
  export const Compass: LucideIcon;
  export const Map: LucideIcon;
  export const Navigation: LucideIcon;
  export const Target: LucideIcon;
  export const Crosshair: LucideIcon;
  export const Flag: LucideIcon;
  export const Award: LucideIcon;
  export const Trophy: LucideIcon;
  export const Medal: LucideIcon;
  export const Gift: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Flame: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Key: LucideIcon;
  export const Fingerprint: LucideIcon;
  export const Scan: LucideIcon;
  export const QrCode: LucideIcon;
  export const LogIn: LucideIcon;
  export const LogOut: LucideIcon;
  export const Power: LucideIcon;
  export const Sun: LucideIcon;
  export const Moon: LucideIcon;
  export const CloudSun: LucideIcon;
  export const Snowflake: LucideIcon;
  export const Droplet: LucideIcon;
  export const Wind: LucideIcon;
  export const Umbrella: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Wallet: LucideIcon;
  export const Brain: LucideIcon;
  export const Bot: LucideIcon;
  export const Sparkle: LucideIcon;
}

