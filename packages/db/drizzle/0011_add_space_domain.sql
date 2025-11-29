-- Migration: Add SPACE to power_domain_type enum
-- The Eighth Mountain: Satellites, orbital slots, off-world resources, launch monopolies
-- This extends the Seven Mountains framework to acknowledge space as a domain of power consolidation

ALTER TYPE "public"."power_domain_type" ADD VALUE IF NOT EXISTS 'SPACE';
