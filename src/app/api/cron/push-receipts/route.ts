/**
 * GET /api/cron/push-receipts
 * Vercel Cron Job - Runs every 10 minutes
 * Checks Expo push notification receipts and handles retries
 *
 * Add to vercel.json crons array with schedule: every 10 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { db } from '@/db';
import { pushTickets, mobilePushTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendExpoMessage } from '@/lib/push-expo';

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true,
});

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sent tickets that haven't been checked yet
    const tickets = await db.query.pushTickets.findMany({
      where: and(
        eq(pushTickets.status, 'sent'),
        eq(pushTickets.type, 'expo')
      ),
    });

    if (tickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tickets to process',
        processed: 0,
      });
    }

    const receiptIds = tickets
      .map(t => t.ticketId)
      .filter(Boolean) as string[];

    if (receiptIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No receipt IDs to check',
        processed: 0,
      });
    }

    // Fetch receipts from Expo
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    let processedCount = 0;
    let deliveredCount = 0;
    let errorCount = 0;
    let retryCount = 0;

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const [receiptId, receipt] of Object.entries(receipts)) {
          const ticket = tickets.find(t => t.ticketId === receiptId);
          if (!ticket) continue;

          processedCount++;

          if (receipt.status === 'ok') {
            // Delivery confirmed
            await db
              .update(pushTickets)
              .set({
                status: 'delivered',
                updatedAt: new Date(),
              })
              .where(eq(pushTickets.ticketId, receiptId));

            deliveredCount++;
          } else if (receipt.status === 'error') {
            const errorMessage = receipt.message || 'Unknown error';
            const errorDetails = receipt.details;

            // Handle device not registered
            if (errorDetails?.error === 'DeviceNotRegistered') {
              await db
                .update(mobilePushTokens)
                .set({ active: false, updatedAt: new Date() })
                .where(eq(mobilePushTokens.token, ticket.token));

              await db
                .update(pushTickets)
                .set({
                  status: 'error',
                  errorMessage: 'DeviceNotRegistered',
                  updatedAt: new Date(),
                })
                .where(eq(pushTickets.ticketId, receiptId));

              errorCount++;
            } else if (ticket.retries < 3) {
              // Retry failed messages up to 3 times
              const newRetryCount = ticket.retries + 1;

              // Exponential backoff: wait 5 min, 10 min, 20 min
              const shouldRetry = true; // We'll retry immediately since this is cron-based

              if (shouldRetry) {
                // Attempt to resend
                const result = await sendExpoMessage(ticket.userId, {
                  token: ticket.token,
                  title: ticket.title,
                  body: ticket.body,
                  data: ticket.data as Record<string, any> || undefined,
                });

                await db
                  .update(pushTickets)
                  .set({
                    status: result.success ? 'sent' : 'error',
                    retries: newRetryCount,
                    errorMessage: result.success ? null : result.error || errorMessage,
                    ticketId: result.ticketId || null,
                    updatedAt: new Date(),
                  })
                  .where(eq(pushTickets.id, ticket.id));

                retryCount++;
              }
            } else {
              // Max retries reached
              await db
                .update(pushTickets)
                .set({
                  status: 'error',
                  errorMessage: `Max retries reached: ${errorMessage}`,
                  updatedAt: new Date(),
                })
                .where(eq(pushTickets.ticketId, receiptId));

              errorCount++;
            }
          }
        }
      } catch (error) {
        console.error('Error processing receipt chunk:', error);
      }
    }

    console.log(
      `✅ Push receipts processed: ${processedCount} total, ${deliveredCount} delivered, ${errorCount} errors, ${retryCount} retries`
    );

    return NextResponse.json({
      success: true,
      processed: processedCount,
      delivered: deliveredCount,
      errors: errorCount,
      retries: retryCount,
    });
  } catch (error) {
    console.error('Error in push-receipts cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
