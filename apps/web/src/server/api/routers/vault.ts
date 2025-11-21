import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { userHasVaultAccess } from '@/server/services/entitlements';

/**
 * Vault tRPC Router
 * 
 * Provides queries for checking Vault access entitlements.
 */
export const vaultRouter = router({
  /**
   * Get user's Vault entitlement status
   */
  getEntitlement: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      return { hasAccess: false };
    }

    const hasAccess = await userHasVaultAccess(ctx.userId);

    return {
      hasAccess,
    };
  }),
});

