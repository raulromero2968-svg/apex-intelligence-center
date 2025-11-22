/**
 * Integration Example: Intelligence Bus in Next.js API Routes
 *
 * This file demonstrates how to integrate the Intelligence Bus
 * into your Next.js application for real-time portfolio analysis.
 *
 * Example API routes:
 * - POST /api/analysis/varc - Queue VaR calculation
 * - POST /api/analysis/lamp - Queue liquidity analysis
 * - POST /api/analysis/contrarian - Queue contrarian signal detection
 * - GET /api/stream/simulation/:id - Stream simulation progress via SSE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { queueVaRCalculation, queueLiquidityAnalysis, queueContrarianAnalysis } from './queue';
import { subscribeToSimulation, PubSubChannels } from './pubsub';

/**
 * Example 1: Queue VARC Analysis
 *
 * POST /api/analysis/varc
 * Body: { portfolioId, holdings, confidenceLevel?, timeHorizon? }
 */
export async function handleVaRCRequest(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { portfolioId, holdings, confidenceLevel, timeHorizon } = req.body;

    // Validate input
    if (!portfolioId || !holdings || !Array.isArray(holdings)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Queue the job
    const job = await queueVaRCalculation({
      portfolioId,
      holdings,
      confidenceLevel,
      timeHorizon,
    });

    // Return job info
    return res.status(202).json({
      success: true,
      jobId: job.id,
      message: 'VaR calculation queued',
      // Client can subscribe to: PubSubChannels.varcResult(portfolioId)
      subscribeChannel: PubSubChannels.varcResult(portfolioId),
    });
  } catch (error) {
    console.error('Error queueing VaR calculation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 2: Queue LAMP Analysis
 *
 * POST /api/analysis/lamp
 * Body: { cardId, marketDepth?, spreadAnalysis?, volumeProfile? }
 */
export async function handleLAMPRequest(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cardId, marketDepth, spreadAnalysis, volumeProfile } = req.body;

    if (!cardId) {
      return res.status(400).json({ error: 'cardId is required' });
    }

    const job = await queueLiquidityAnalysis({
      cardId,
      marketDepth,
      spreadAnalysis,
      volumeProfile,
    });

    return res.status(202).json({
      success: true,
      jobId: job.id,
      message: 'Liquidity analysis queued',
      subscribeChannel: PubSubChannels.lampResult(cardId),
    });
  } catch (error) {
    console.error('Error queueing LAMP analysis:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 3: Queue Contrarian Analysis
 *
 * POST /api/analysis/contrarian
 * Body: { game, signalType, threshold?, lookbackDays? }
 */
export async function handleContrarianRequest(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { game, signalType, threshold, lookbackDays } = req.body;

    if (!game || !signalType) {
      return res.status(400).json({ error: 'game and signalType are required' });
    }

    const job = await queueContrarianAnalysis({
      game,
      signalType,
      threshold,
      lookbackDays,
    });

    return res.status(202).json({
      success: true,
      jobId: job.id,
      message: 'Contrarian analysis queued',
      subscribeChannel: PubSubChannels.contrarianSignal(game),
    });
  } catch (error) {
    console.error('Error queueing contrarian analysis:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Example 4: Server-Sent Events (SSE) for Real-Time Updates
 *
 * GET /api/stream/simulation/:id
 *
 * Usage in client:
 * ```typescript
 * const eventSource = new EventSource('/api/stream/simulation/sim-123');
 * eventSource.addEventListener('progress', (e) => {
 *   const data = JSON.parse(e.data);
 *   console.log('Progress:', data.progress);
 * });
 * eventSource.addEventListener('complete', (e) => {
 *   const data = JSON.parse(e.data);
 *   console.log('Result:', data);
 *   eventSource.close();
 * });
 * ```
 */
export async function handleSimulationStream(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid simulation ID' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Subscribe to simulation updates
  const unsubscribe = await subscribeToSimulation(
    id,
    (progress) => {
      // Send progress event
      res.write(`event: progress\n`);
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    },
    (result) => {
      // Send completion event
      res.write(`event: complete\n`);
      res.write(`data: ${JSON.stringify(result)}\n\n`);

      // Close connection after result
      setTimeout(async () => {
        await unsubscribe();
        res.end();
      }, 100);
    }
  );

  // Handle client disconnect
  req.on('close', async () => {
    await unsubscribe();
    res.end();
  });
}

/**
 * Example 5: WebSocket Integration (Alternative to SSE)
 *
 * For bidirectional communication, use Socket.IO:
 *
 * Server:
 * ```typescript
 * import { Server } from 'socket.io';
 * import { subscribeToSimulation } from './lib/pubsub';
 *
 * io.on('connection', (socket) => {
 *   socket.on('subscribe:simulation', async (simulationId) => {
 *     const unsubscribe = await subscribeToSimulation(
 *       simulationId,
 *       (progress) => socket.emit('simulation:progress', progress),
 *       (result) => {
 *         socket.emit('simulation:complete', result);
 *         unsubscribe();
 *       }
 *     );
 *
 *     socket.on('disconnect', () => unsubscribe());
 *   });
 * });
 * ```
 *
 * Client:
 * ```typescript
 * import { io } from 'socket.io-client';
 *
 * const socket = io();
 * socket.emit('subscribe:simulation', 'sim-123');
 * socket.on('simulation:progress', (data) => console.log('Progress:', data));
 * socket.on('simulation:complete', (data) => console.log('Complete:', data));
 * ```
 */

/**
 * Example 6: React Hook for Real-Time Updates
 *
 * ```typescript
 * import { useEffect, useState } from 'react';
 *
 * export function useVaRCAnalysis(portfolioId: string) {
 *   const [result, setResult] = useState(null);
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState(null);
 *
 *   const analyze = async (holdings) => {
 *     setLoading(true);
 *     setError(null);
 *
 *     try {
 *       // Queue analysis
 *       const response = await fetch('/api/analysis/varc', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ portfolioId, holdings }),
 *       });
 *
 *       if (!response.ok) throw new Error('Failed to queue analysis');
 *
 *       const { subscribeChannel } = await response.json();
 *
 *       // Subscribe to results via SSE
 *       const eventSource = new EventSource(
 *         `/api/stream/channel?channel=${encodeURIComponent(subscribeChannel)}`
 *       );
 *
 *       eventSource.onmessage = (event) => {
 *         const data = JSON.parse(event.data);
 *         setResult(data);
 *         setLoading(false);
 *         eventSource.close();
 *       };
 *
 *       eventSource.onerror = () => {
 *         setError('Connection error');
 *         setLoading(false);
 *         eventSource.close();
 *       };
 *     } catch (err) {
 *       setError(err.message);
 *       setLoading(false);
 *     }
 *   };
 *
 *   return { result, loading, error, analyze };
 * }
 * ```
 */

/**
 * Example 7: Batch Analysis
 *
 * Process multiple cards in parallel:
 *
 * ```typescript
 * async function analyzeBatch(cardIds: string[]) {
 *   const jobs = await Promise.all(
 *     cardIds.map(cardId =>
 *       queueLiquidityAnalysis({
 *         cardId,
 *         marketDepth: true,
 *         spreadAnalysis: true,
 *         volumeProfile: true,
 *       })
 *     )
 *   );
 *
 *   return jobs.map(job => ({
 *     jobId: job.id,
 *     cardId: job.data.cardId,
 *   }));
 * }
 * ```
 */

/**
 * Example 8: Scheduled Analysis (Cron)
 *
 * Run nightly portfolio risk analysis:
 *
 * ```typescript
 * // pages/api/cron/nightly-var.ts
 * import { queueVaRCalculation } from '@/lib/queue';
 * import { db } from '@/lib/db';
 *
 * export default async function handler(req, res) {
 *   // Verify cron secret
 *   if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
 *     return res.status(401).json({ error: 'Unauthorized' });
 *   }
 *
 *   // Fetch all active portfolios
 *   const portfolios = await db.portfolio.findMany({
 *     where: { active: true },
 *     include: { holdings: true },
 *   });
 *
 *   // Queue VaR for each portfolio
 *   const jobs = await Promise.all(
 *     portfolios.map(p =>
 *       queueVaRCalculation({
 *         portfolioId: p.id,
 *         holdings: p.holdings,
 *       })
 *     )
 *   );
 *
 *   return res.json({
 *     success: true,
 *     queued: jobs.length,
 *   });
 * }
 * ```
 *
 * Add to vercel.json:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/nightly-var",
 *     "schedule": "0 3 * * *"
 *   }]
 * }
 * ```
 */

export default {
  handleVaRCRequest,
  handleLAMPRequest,
  handleContrarianRequest,
  handleSimulationStream,
};
