import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

/**
 * Initialize SQLite database for offline-first data storage
 * - Portfolio data
 * - Watchlist
 * - Cached card prices
 * - Sync queue for pending changes
 */

// Open/create the SQLite database
const expo = SQLite.openDatabaseSync('apex-intelligence.db');

// Initialize Drizzle ORM with the Expo SQLite instance
export const db = drizzle(expo);

/**
 * Initialize database tables
 * Should be called on app startup
 */
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    // Note: In production, you'd use Drizzle migrations
    // For now, we'll create tables manually

    await expo.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        card_id TEXT NOT NULL,
        game TEXT NOT NULL,
        target_price INTEGER,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS portfolio (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        card_id TEXT NOT NULL,
        game TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        purchase_price INTEGER,
        purchase_date INTEGER,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email INTEGER DEFAULT 1,
        push INTEGER DEFAULT 1,
        price_alerts INTEGER DEFAULT 1,
        weekly_digest INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        synced INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
      CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Queue a change for sync when online
 */
export async function queueForSync(
  tableName: string,
  operation: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>
) {
  const id = generateId();

  await expo.execAsync(`
    INSERT INTO sync_queue (id, table_name, operation, data)
    VALUES (?, ?, ?, ?)
  `, [id, tableName, operation, JSON.stringify(data)]);
}

/**
 * Sync pending changes to the server
 */
export async function syncToServer() {
  try {
    // Get all unsynced items
    const result = await expo.execAsync(`
      SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC
    `);

    if (!result.rows || result.rows.length === 0) {
      return { success: true, synced: 0 };
    }

    const items = result.rows._array || result.rows;
    let syncedCount = 0;

    // Sync each item
    for (const item of items) {
      try {
        // TODO: Replace with actual API endpoint
        const response = await fetch(`/api/sync/${item.table_name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: item.operation,
            data: JSON.parse(item.data),
          }),
        });

        if (response.ok) {
          // Mark as synced
          await expo.execAsync(`
            UPDATE sync_queue SET synced = 1 WHERE id = ?
          `, [item.id]);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        // Continue with next item
      }
    }

    // Clean up synced items older than 7 days
    await expo.execAsync(`
      DELETE FROM sync_queue
      WHERE synced = 1
      AND created_at < strftime('%s', 'now') - 604800
    `);

    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('Error syncing to server:', error);
    return { success: false, error };
  }
}

/**
 * Simple ID generator (use a proper UUID library in production)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
