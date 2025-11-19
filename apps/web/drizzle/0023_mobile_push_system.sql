-- Mobile Push Notification System
-- Hybrid FCM + Expo Push tokens and receipt tracking

-- Mobile Push Tokens table
CREATE TABLE IF NOT EXISTS "mobile_push_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "type" text NOT NULL,
  "device_id" text,
  "platform" text,
  "active" boolean NOT NULL DEFAULT true,
  "last_used_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Push Tickets table for receipt tracking
CREATE TABLE IF NOT EXISTS "push_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" text UNIQUE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'sent',
  "title" text NOT NULL,
  "body" text NOT NULL,
  "data" jsonb,
  "retries" integer NOT NULL DEFAULT 0,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for mobile_push_tokens
CREATE INDEX IF NOT EXISTS "idx_mobile_push_user" ON "mobile_push_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_mobile_push_token" ON "mobile_push_tokens"("token");
CREATE INDEX IF NOT EXISTS "idx_mobile_push_active" ON "mobile_push_tokens"("active");

-- Indexes for push_tickets
CREATE INDEX IF NOT EXISTS "idx_push_ticket_id" ON "push_tickets"("ticket_id");
CREATE INDEX IF NOT EXISTS "idx_push_ticket_status" ON "push_tickets"("status");
CREATE INDEX IF NOT EXISTS "idx_push_ticket_user" ON "push_tickets"("user_id");

-- Comments for documentation
COMMENT ON TABLE "mobile_push_tokens" IS 'FCM and Expo Push tokens for mobile devices';
COMMENT ON TABLE "push_tickets" IS 'Push notification receipt tracking with retry support';
COMMENT ON COLUMN "mobile_push_tokens"."type" IS 'Token type: fcm or expo';
COMMENT ON COLUMN "mobile_push_tokens"."platform" IS 'Device platform: ios or android';
COMMENT ON COLUMN "push_tickets"."status" IS 'Receipt status: sent, delivered, error, retry';
