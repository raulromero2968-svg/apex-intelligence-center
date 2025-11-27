CREATE TABLE "gam_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"memo" text NOT NULL,
	"page" jsonb NOT NULL,
	"embedding" vector(1536),
	"session_id" text,
	"agent_id" text,
	"reliability_score" real DEFAULT 0.5,
	"access_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "gam_rl_training_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task" text NOT NULL,
	"history" text,
	"response" text,
	"rewards" jsonb,
	"model" text DEFAULT 'gpt-4o-mini',
	"trained" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gam_research_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request" text NOT NULL,
	"initial_memory" text,
	"iterations" jsonb DEFAULT '[]'::jsonb,
	"result" text,
	"metrics" jsonb,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "idx_gam_pages_agent" ON "gam_pages" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_gam_pages_session" ON "gam_pages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_gam_pages_reliability" ON "gam_pages" USING btree ("reliability_score");--> statement-breakpoint
CREATE INDEX "idx_gam_pages_created_at" ON "gam_pages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_gam_rl_trained" ON "gam_rl_training_data" USING btree ("trained");--> statement-breakpoint
CREATE INDEX "idx_gam_rl_created_at" ON "gam_rl_training_data" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_gam_research_status" ON "gam_research_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gam_research_created_at" ON "gam_research_sessions" USING btree ("created_at");