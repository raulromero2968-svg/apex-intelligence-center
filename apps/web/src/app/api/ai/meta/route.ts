import { NextResponse } from 'next/server';

// Force dynamic rendering - do not attempt static analysis during build
export const dynamic = 'force-dynamic';
import facts from '@/../../data/facts.json';

/**
 * GET /api/ai/meta
 *
 * Returns stable organizational facts from the central facts registry.
 * This endpoint provides consistent, single-source-of-truth data about
 * Apex Intelligence for use in AI responses, metadata generation, and JSON-LD.
 *
 * @returns JSON response with organizational facts
 */
export async function GET() {
  return NextResponse.json(facts, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

/**
 * Type definitions for facts structure
 */
export type OrganizationFacts = typeof facts;
export type Organization = typeof facts.organization;
export type Product = typeof facts.product;
export type Pricing = typeof facts.pricing;
export type Links = typeof facts.links;
export type Technology = typeof facts.technology;

