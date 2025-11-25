CREATE TABLE "alert_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text,
	"alert_type" text NOT NULL,
	"threshold" real NOT NULL,
	"channels" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arbitrage_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"buy_source" text NOT NULL,
	"buy_price" real NOT NULL,
	"sell_source" text NOT NULL,
	"sell_price" real NOT NULL,
	"spread_pct" real NOT NULL,
	"risk_adjusted_spread_pct" real NOT NULL,
	"liquidity" integer NOT NULL,
	"shipping_cost" real,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_forensics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" text NOT NULL,
	"reasoning_trace" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"detected_defects" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"authenticity_score" real NOT NULL,
	"model_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"set_name" text NOT NULL,
	"card_number" text NOT NULL,
	"game" text NOT NULL,
	"artist" text,
	"rarity" text,
	"tcgplayer_id" integer,
	"scryfall_id" text,
	"just_tcg_id" text,
	"apex_score" real,
	"seven_day_gain_percent" real,
	"is_manipulated" boolean DEFAULT false,
	"manipulation_reason" text,
	"last_flagged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child_activity_history" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"activity_data" jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_info" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"blocked_by_bedtime" boolean DEFAULT false NOT NULL,
	"blocked_by_cool_down" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_unlisted" boolean DEFAULT false NOT NULL,
	"type" text DEFAULT 'default' NOT NULL,
	"search_params" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "compliance_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"trace_hash" text NOT NULL,
	"ipfs_cid" text NOT NULL,
	"user_id" text,
	"query" text NOT NULL,
	"response" text NOT NULL,
	"citation_count" integer NOT NULL,
	"synthesis_count" integer NOT NULL,
	"novelty_score" real NOT NULL,
	"is_valid" boolean NOT NULL,
	"validation_errors" jsonb,
	"system_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_logs_trace_hash_unique" UNIQUE("trace_hash"),
	CONSTRAINT "compliance_logs_ipfs_cid_unique" UNIQUE("ipfs_cid")
);
--> statement-breakpoint
CREATE TABLE "family_links" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_id" text NOT NULL,
	"child_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"child_cannot_revoke" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"card_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"cost_basis_usd" real NOT NULL,
	"acquired_date" timestamp NOT NULL,
	"grade" text,
	"grading_company" text,
	"cert_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "human_conception_statements" (
	"id" text PRIMARY KEY NOT NULL,
	"insight_id" text NOT NULL,
	"researcher_id" text NOT NULL,
	"statement" text NOT NULL,
	"prompt_chain" jsonb NOT NULL,
	"signature" text NOT NULL,
	"ipfs_cid" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "human_conception_statements_insight_id_unique" UNIQUE("insight_id"),
	CONSTRAINT "human_conception_statements_ipfs_cid_unique" UNIQUE("ipfs_cid")
);
--> statement-breakpoint
CREATE TABLE "maker_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"task_type" text NOT NULL,
	"status" text NOT NULL,
	"total_steps" integer,
	"successful_steps" integer DEFAULT 0,
	"total_votes_cast" integer DEFAULT 0,
	"red_flagged_votes" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maker_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"card_id" text,
	"step_name" text NOT NULL,
	"vote_index" integer NOT NULL,
	"result_hash" text,
	"result_json" jsonb,
	"is_red_flagged" boolean DEFAULT false NOT NULL,
	"red_flag_reason" text,
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manipulation_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"volume_spike_pct" real NOT NULL,
	"baseline_volume" real NOT NULL,
	"current_volume" integer NOT NULL,
	"lamp_sentiment" text NOT NULL,
	"contrarian_diversity" real NOT NULL,
	"severity" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"detected_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"price" real NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"sale_date" timestamp NOT NULL,
	"grade" text,
	"grading_company" text,
	"cert_number" text,
	"proof_url" text NOT NULL,
	"proof_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_by_varc" boolean DEFAULT false NOT NULL,
	"varc_confidence" real,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_knowledge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sentiment" text NOT NULL,
	"claim_type" text NOT NULL,
	"reliability_score" real NOT NULL,
	"cluster_id" integer,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobile_push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"device_id" text,
	"platform" text,
	"active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "multi_modal_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parental_controls" (
	"id" text PRIMARY KEY NOT NULL,
	"family_link_id" text NOT NULL,
	"child_id" text NOT NULL,
	"bedtime_enabled" boolean DEFAULT false NOT NULL,
	"bedtime_start" text,
	"bedtime_end" text,
	"bedtime_timezone" text DEFAULT 'America/New_York',
	"cool_down_enabled" boolean DEFAULT false NOT NULL,
	"cool_down_minutes" integer DEFAULT 30,
	"notifications_disabled" boolean DEFAULT false NOT NULL,
	"disabled_channels" jsonb DEFAULT '[]'::jsonb,
	"daily_trading_limit" integer,
	"max_portfolio_value" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "population_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"grading_company" text NOT NULL,
	"total_pop" integer NOT NULL,
	"grade10_count" integer NOT NULL,
	"pop_higher" integer,
	"last_updated" timestamp NOT NULL,
	"delta30d" integer,
	"growth_rate_90d" real,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Main' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"source" text NOT NULL,
	"market" real NOT NULL,
	"low" real,
	"high" real,
	"psa10" real,
	"psa9" real,
	"cgc_black_label" real,
	"bgs95" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "push_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" text,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"retries" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_tickets_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"sale_price" real NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"sale_date" timestamp NOT NULL,
	"grade" text,
	"grading_company" text,
	"cert_number" text,
	"source" text NOT NULL,
	"ebay_item_id" text,
	"image_urls" jsonb,
	"seller_username" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_start" timestamp NOT NULL,
	"session_end" timestamp,
	"duration_minutes" integer,
	"pages_viewed" integer DEFAULT 0 NOT NULL,
	"cards_viewed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actions_performed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"device_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spend_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount_usd" real NOT NULL,
	"payment_type" text NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_charge_id" text,
	"onchain_tx_hash" text,
	"onchain_network" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tcg_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"subscription_status" text,
	"subscription_ends_at" timestamp,
	"break_mode_until" timestamp,
	"break_mode_activated_by" text,
	"trust_score" integer DEFAULT 10 NOT NULL,
	"data_points" integer DEFAULT 0 NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"nft_minted" boolean DEFAULT false NOT NULL,
	"wallet_address" text,
	"parent_id" text,
	"account_type" text DEFAULT 'independent' NOT NULL,
	"account_frozen" boolean DEFAULT false NOT NULL,
	"account_frozen_at" timestamp,
	"account_frozen_by" text,
	"bedtime_enabled" boolean DEFAULT false NOT NULL,
	"bedtime_start" text,
	"bedtime_end" text,
	"cooldown_enabled" boolean DEFAULT true NOT NULL,
	"spending_limit_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "video_generation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"script" text NOT NULL,
	"setting" text NOT NULL,
	"duration" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"output_url" text,
	"processing_started_at" timestamp,
	"processing_completed_at" timestamp,
	"error_message" text,
	"retrieval_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"card_id" text NOT NULL,
	"target_price" real NOT NULL,
	"direction" text NOT NULL,
	"is_triggered" boolean DEFAULT false NOT NULL,
	"triggered_at" timestamp,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arbitrage_opportunities" ADD CONSTRAINT "arbitrage_opportunities_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_forensics" ADD CONSTRAINT "card_forensics_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_activity_history" ADD CONSTRAINT "child_activity_history_child_id_users_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_child_id_users_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maker_votes" ADD CONSTRAINT "maker_votes_task_id_maker_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."maker_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maker_votes" ADD CONSTRAINT "maker_votes_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manipulation_alerts" ADD CONSTRAINT "manipulation_alerts_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_submissions" ADD CONSTRAINT "market_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_submissions" ADD CONSTRAINT "market_submissions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_push_tokens" ADD CONSTRAINT "mobile_push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_modal_embeddings" ADD CONSTRAINT "multi_modal_embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parental_controls" ADD CONSTRAINT "parental_controls_family_link_id_family_links_id_fk" FOREIGN KEY ("family_link_id") REFERENCES "public"."family_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parental_controls" ADD CONSTRAINT "parental_controls_child_id_users_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "population_reports" ADD CONSTRAINT "population_reports_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tickets" ADD CONSTRAINT "push_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_history" ADD CONSTRAINT "session_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_tracking" ADD CONSTRAINT "spend_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_generation_requests" ADD CONSTRAINT "video_generation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_alerts_user_active" ON "alert_subscriptions" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_alerts_card_type" ON "alert_subscriptions" USING btree ("card_id","alert_type");--> statement-breakpoint
CREATE INDEX "idx_arb_spread_expires" ON "arbitrage_opportunities" USING btree ("spread_pct","expires_at");--> statement-breakpoint
CREATE INDEX "idx_arb_card" ON "arbitrage_opportunities" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_card_forensics_card_id" ON "card_forensics" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_card_forensics_authenticity_score" ON "card_forensics" USING btree ("authenticity_score");--> statement-breakpoint
CREATE INDEX "idx_card_forensics_model_version" ON "card_forensics" USING btree ("model_version");--> statement-breakpoint
CREATE INDEX "idx_card_forensics_created_at" ON "card_forensics" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "card_forensics_card_unique" ON "card_forensics" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_cards_game_apex" ON "cards" USING btree ("game","apex_score");--> statement-breakpoint
CREATE INDEX "idx_cards_name" ON "cards" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cards_unique" ON "cards" USING btree ("name","set_name","card_number","game");--> statement-breakpoint
CREATE INDEX "idx_child_activity_history_child_timestamp" ON "child_activity_history" USING btree ("child_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_child_activity_history_activity_type" ON "child_activity_history" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_child_activity_history_timestamp" ON "child_activity_history" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_collections_public_updated" ON "collections" USING btree ("is_public","updated_at");--> statement-breakpoint
CREATE INDEX "idx_compliance_user_created" ON "compliance_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_compliance_novelty" ON "compliance_logs" USING btree ("novelty_score");--> statement-breakpoint
CREATE INDEX "idx_compliance_created" ON "compliance_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_family_links_parent" ON "family_links" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_family_links_child" ON "family_links" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_family_links_status" ON "family_links" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_family_links_parent_child_unique" ON "family_links" USING btree ("parent_id","child_id");--> statement-breakpoint
CREATE INDEX "idx_holdings_portfolio" ON "holdings" USING btree ("portfolio_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_holdings_cert_unique" ON "holdings" USING btree ("cert_number");--> statement-breakpoint
CREATE INDEX "idx_conception_researcher" ON "human_conception_statements" USING btree ("researcher_id");--> statement-breakpoint
CREATE INDEX "idx_conception_created" ON "human_conception_statements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_maker_tasks_status" ON "maker_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_maker_tasks_type" ON "maker_tasks" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "idx_maker_tasks_started" ON "maker_tasks" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_maker_votes_task" ON "maker_votes" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_maker_votes_step" ON "maker_votes" USING btree ("step_name");--> statement-breakpoint
CREATE INDEX "idx_maker_votes_hash" ON "maker_votes" USING btree ("result_hash");--> statement-breakpoint
CREATE INDEX "idx_maker_votes_flagged" ON "maker_votes" USING btree ("is_red_flagged");--> statement-breakpoint
CREATE INDEX "idx_manipulation_card_active" ON "manipulation_alerts" USING btree ("card_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_manipulation_severity" ON "manipulation_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_manipulation_detected" ON "manipulation_alerts" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_submissions_user" ON "market_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_card" ON "market_submissions" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "market_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_submissions_created" ON "market_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_market_knowledge_sentiment_claim_type" ON "market_knowledge" USING btree ("sentiment","claim_type");--> statement-breakpoint
CREATE INDEX "idx_market_knowledge_reliability" ON "market_knowledge" USING btree ("reliability_score");--> statement-breakpoint
CREATE INDEX "idx_market_knowledge_cluster" ON "market_knowledge" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "idx_market_knowledge_sentiment_reliability" ON "market_knowledge" USING btree ("sentiment","reliability_score");--> statement-breakpoint
CREATE INDEX "idx_market_knowledge_created_at" ON "market_knowledge" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mobile_push_user" ON "mobile_push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mobile_push_token" ON "mobile_push_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_mobile_push_active" ON "mobile_push_tokens" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_multimodal_user" ON "multi_modal_embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_multimodal_type" ON "multi_modal_embeddings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_multimodal_user_type" ON "multi_modal_embeddings" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "idx_multimodal_created_at" ON "multi_modal_embeddings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_parental_controls_child" ON "parental_controls" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_parental_controls_family_link" ON "parental_controls" USING btree ("family_link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_parental_controls_child_unique" ON "parental_controls" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_pop_card_company" ON "population_reports" USING btree ("card_id","grading_company");--> statement-breakpoint
CREATE INDEX "idx_pop_delta" ON "population_reports" USING btree ("delta30d");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pop_unique" ON "population_reports" USING btree ("card_id","grading_company","last_updated");--> statement-breakpoint
CREATE INDEX "idx_portfolios_user" ON "portfolios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prices_card_date" ON "prices" USING btree ("card_id","date");--> statement-breakpoint
CREATE INDEX "idx_prices_source_date" ON "prices" USING btree ("source","date");--> statement-breakpoint
CREATE INDEX "idx_push_user" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_push_ticket_id" ON "push_tickets" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_push_ticket_status" ON "push_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_push_ticket_user" ON "push_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sales_card_date" ON "sales" USING btree ("card_id","sale_date");--> statement-breakpoint
CREATE INDEX "idx_sales_source_date" ON "sales" USING btree ("source","sale_date");--> statement-breakpoint
CREATE INDEX "idx_sales_cert" ON "sales" USING btree ("cert_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sales_cert_unique" ON "sales" USING btree ("cert_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sales_ebay_unique" ON "sales" USING btree ("ebay_item_id");--> statement-breakpoint
CREATE INDEX "idx_session_history_user" ON "session_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_history_start" ON "session_history" USING btree ("session_start");--> statement-breakpoint
CREATE INDEX "idx_spend_tracking_user_created" ON "spend_tracking" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_spend_tracking_user_status" ON "spend_tracking" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_spend_tracking_stripe_pi" ON "spend_tracking" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_spend_tracking_onchain_tx" ON "spend_tracking" USING btree ("onchain_tx_hash");--> statement-breakpoint
CREATE INDEX "idx_spend_tracking_created" ON "spend_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_spend_tracking_stripe_unique" ON "spend_tracking" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_spend_tracking_onchain_unique" ON "spend_tracking" USING btree ("onchain_tx_hash","onchain_network");--> statement-breakpoint
CREATE INDEX "idx_video_gen_user" ON "video_generation_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_video_gen_status" ON "video_generation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_video_gen_created_at" ON "video_generation_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_watchlist_user" ON "watchlist_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_watchlist_card" ON "watchlist_items" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_watchlist_triggered" ON "watchlist_items" USING btree ("is_triggered");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_watchlist_user_card_unique" ON "watchlist_items" USING btree ("user_id","card_id");