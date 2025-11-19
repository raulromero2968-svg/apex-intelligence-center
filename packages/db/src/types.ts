import { users, watchlist, portfolio, notificationPreferences, pushTokens, pushTickets } from './schema';

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type WatchlistItem = typeof watchlist.$inferSelect;
export type NewWatchlistItem = typeof watchlist.$inferInsert;

export type PortfolioItem = typeof portfolio.$inferSelect;
export type NewPortfolioItem = typeof portfolio.$inferInsert;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

export type PushToken = typeof pushTokens.$inferSelect;
export type NewPushToken = typeof pushTokens.$inferInsert;

export type PushTicket = typeof pushTickets.$inferSelect;
export type NewPushTicket = typeof pushTickets.$inferInsert;
