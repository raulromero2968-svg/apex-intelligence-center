/**
 * Daily Spend Tracker
 *
 * Tracks user's daily spending for display in reality check modal.
 * Uses localStorage for client-side tracking.
 *
 * In production, this should query actual transaction/billing data from the database.
 */

const STORAGE_KEY = 'apex_daily_spend';

export interface DailySpendData {
  date: string; // YYYY-MM-DD format
  totalSpend: number; // Total spend in dollars
  transactions: Array<{
    amount: number;
    description: string;
    timestamp: number;
  }>;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Load daily spend data from localStorage
 */
function loadSpendData(): DailySpendData {
  if (typeof window === 'undefined') {
    return {
      date: getTodayDate(),
      totalSpend: 0,
      transactions: [],
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as DailySpendData;

      // Check if data is from today
      if (data.date === getTodayDate()) {
        return data;
      }
    }
  } catch (error) {
    console.error('Failed to load spend data:', error);
  }

  // Return fresh data for today
  return {
    date: getTodayDate(),
    totalSpend: 0,
    transactions: [],
  };
}

/**
 * Save spend data to localStorage
 */
function saveSpendData(data: DailySpendData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save spend data:', error);
  }
}

/**
 * Get today's total spend
 */
export function getDailySpend(): number {
  const data = loadSpendData();
  return data.totalSpend;
}

/**
 * Add a transaction to today's spend
 *
 * @param amount - Amount in dollars
 * @param description - Transaction description
 */
export function addTransaction(amount: number, description: string): void {
  const data = loadSpendData();

  // Add transaction
  data.transactions.push({
    amount,
    description,
    timestamp: Date.now(),
  });

  // Update total
  data.totalSpend += amount;

  // Save
  saveSpendData(data);
}

/**
 * Get all transactions for today
 */
export function getTodayTransactions(): DailySpendData['transactions'] {
  const data = loadSpendData();
  return data.transactions;
}

/**
 * Reset today's spend (for testing)
 */
export function resetDailySpend(): void {
  const data: DailySpendData = {
    date: getTodayDate(),
    totalSpend: 0,
    transactions: [],
  };
  saveSpendData(data);
}

/**
 * Simulate some spending (for demo purposes)
 * Remove this in production
 */
export function simulateSpending(): void {
  const scenarios = [
    { amount: 49.99, description: 'Premium subscription' },
    { amount: 15.00, description: 'Research query credits' },
    { amount: 29.99, description: 'Card analysis bundle' },
    { amount: 99.99, description: 'Pro tier upgrade' },
  ];

  const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  addTransaction(randomScenario.amount, randomScenario.description);
}
