/**
 * TCG Community Schema for Apex Intelligence
 *
 * Implements vendor tools, event scheduling, and wholesome community features:
 * - Vendor profiles and inventory management
 * - TCG event scheduling and attendance
 * - Donations and community shoutouts
 * - Anti-scalping price alerts
 * - Kid-friendly guides and accessibility
 *
 * @see knowledge-09-database-architecture for schema patterns
 * @see knowledge-02-ai-rag-architecture-v2 for RAG valuation
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  real,
  index,
  uniqueIndex,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, cards } from '../schema';

// ============================================================================
// VENDOR PROFILES
// ============================================================================

/**
 * Vendors - TCG creators and sellers (Beard Dad, Coop's Collection, etc.)
 *
 * Stores vendor profiles for creators with YouTube channels, Linktree,
 * and vending schedules. Supports portfolio tracking and inventory management.
 */
export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Profile information
    name: text('name').notNull(),
    bio: text('bio'),
    profileImageUrl: text('profile_image_url'),

    // Social links
    youtubeUrl: text('youtube_url'),
    linktreeUrl: text('linktree_url'),
    twitterHandle: text('twitter_handle'),
    instagramHandle: text('instagram_handle'),
    tiktokHandle: text('tiktok_handle'),
    websiteUrl: text('website_url'),

    // Vendor type and specialization
    vendorType: text('vendor_type', {
      enum: ['individual', 'store', 'creator', 'convention'],
    })
      .default('individual')
      .notNull(),
    primaryGame: text('primary_game', {
      enum: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'one_piece', 'multi'],
    }),
    specialties: jsonb('specialties').$type<string[]>().default([]),

    // Location for event matching
    city: text('city'),
    state: text('state'),
    country: text('country').default('US'),

    // Trust and verification
    isVerified: boolean('is_verified').default(false).notNull(),
    trustScore: real('trust_score').default(0.5), // 0-1 scale
    totalSales: integer('total_sales').default(0).notNull(),
    positiveRatings: integer('positive_ratings').default(0).notNull(),
    totalRatings: integer('total_ratings').default(0).notNull(),

    // Fair pricing commitment (anti-scalping)
    fairPricingPledge: boolean('fair_pricing_pledge').default(false).notNull(),
    maxMarkupPercent: real('max_markup_percent'), // Self-declared max markup

    // Kid-friendly indicators
    kidFriendly: boolean('kid_friendly').default(true).notNull(),
    offersDiscountsForKids: boolean('offers_discounts_for_kids')
      .default(false)
      .notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex('idx_vendors_user').on(table.userId),
    nameIdx: index('idx_vendors_name').on(table.name),
    gameIdx: index('idx_vendors_game').on(table.primaryGame),
    locationIdx: index('idx_vendors_location').on(table.city, table.state),
    verifiedIdx: index('idx_vendors_verified').on(table.isVerified),
    fairPricingIdx: index('idx_vendors_fair_pricing').on(
      table.fairPricingPledge
    ),
  })
);

// ============================================================================
// VENDOR INVENTORY
// ============================================================================

/**
 * Vendor Inventories - Real-time inventory tracking with RAG valuation
 *
 * Enables vendors to manage their card inventory with pricing,
 * condition tracking, and AI-powered valuation suggestions.
 */
export const vendorInventories = pgTable(
  'vendor_inventories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),
    cardId: text('card_id').references(() => cards.id, {
      onDelete: 'set null',
    }),

    // Custom card entry (for cards not in DB)
    customCardName: text('custom_card_name'),
    customSetName: text('custom_set_name'),
    customGame: text('custom_game', {
      enum: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'one_piece', 'other'],
    }),

    // Inventory details
    quantity: integer('quantity').notNull().default(1),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').default('USD').notNull(),

    // Condition and grading
    condition: text('condition', {
      enum: [
        'raw_mint',
        'raw_nm',
        'raw_lp',
        'raw_mp',
        'raw_hp',
        'psa_10',
        'psa_9',
        'psa_8',
        'psa_7',
        'bgs_10',
        'bgs_9_5',
        'bgs_9',
        'cgc_10',
        'cgc_9_5',
        'sgc_10',
        'other',
      ],
    }).default('raw_nm'),
    gradingCertNumber: text('grading_cert_number'),

    // RAG valuation
    estimatedValue: decimal('estimated_value', {
      precision: 10,
      scale: 2,
    }),
    valuationConfidence: real('valuation_confidence'), // 0-1
    lastValuatedAt: timestamp('last_valuated_at'),

    // Listing status
    isListed: boolean('is_listed').default(true).notNull(),
    isReserved: boolean('is_reserved').default(false).notNull(),
    reservedFor: text('reserved_for'), // User ID or name

    // Fair pricing flag
    isFairPriced: boolean('is_fair_priced').default(true), // Auto-flagged if price > 30% above market

    // Image for verification
    imageUrl: text('image_url'),

    // Notes
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index('idx_vendor_inventories_vendor').on(table.vendorId),
    cardIdx: index('idx_vendor_inventories_card').on(table.cardId),
    listedIdx: index('idx_vendor_inventories_listed').on(table.isListed),
    priceIdx: index('idx_vendor_inventories_price').on(table.price),
    conditionIdx: index('idx_vendor_inventories_condition').on(table.condition),
    fairPricedIdx: index('idx_vendor_inventories_fair_priced').on(
      table.isFairPriced
    ),
  })
);

// ============================================================================
// TCG EVENTS
// ============================================================================

/**
 * TCG Events - Convention, local shop, and vending events
 *
 * Tracks TCG events with scheduling, vendor participation,
 * and community attendance tracking.
 */
export const tcgEvents = pgTable(
  'tcg_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: text('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id').references(() => vendors.id, {
      onDelete: 'set null',
    }),

    // Event details
    name: text('name').notNull(),
    description: text('description'),
    eventType: text('event_type', {
      enum: [
        'convention',
        'local_shop',
        'pop_up',
        'online',
        'meetup',
        'tournament',
        'pack_opening',
      ],
    }).notNull(),

    // Location
    venueName: text('venue_name'),
    address: text('address'),
    city: text('city').notNull(),
    state: text('state'),
    country: text('country').default('US').notNull(),
    isOnline: boolean('is_online').default(false).notNull(),
    onlineUrl: text('online_url'),

    // Timing
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    timezone: text('timezone').default('America/New_York'),
    isAllDay: boolean('is_all_day').default(false).notNull(),

    // Capacity and registration
    maxAttendees: integer('max_attendees'),
    currentAttendees: integer('current_attendees').default(0).notNull(),
    requiresRegistration: boolean('requires_registration')
      .default(false)
      .notNull(),
    registrationUrl: text('registration_url'),

    // Event features
    features: jsonb('features').$type<{
      hasVending: boolean;
      hasTournament: boolean;
      hasPackOpening: boolean;
      hasTrading: boolean;
      hasGiveaways: boolean;
      hasMeetAndGreet: boolean;
      kidFriendly: boolean;
      freeEntry: boolean;
      entryFee?: number;
    }>(),

    // Games featured
    featuredGames: jsonb('featured_games').$type<string[]>().default([]),

    // Status
    status: text('status', {
      enum: ['draft', 'published', 'cancelled', 'completed'],
    })
      .default('draft')
      .notNull(),

    // Social
    coverImageUrl: text('cover_image_url'),
    externalUrl: text('external_url'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    creatorIdx: index('idx_tcg_events_creator').on(table.creatorId),
    vendorIdx: index('idx_tcg_events_vendor').on(table.vendorId),
    dateIdx: index('idx_tcg_events_date').on(table.startDate),
    locationIdx: index('idx_tcg_events_location').on(table.city, table.state),
    statusIdx: index('idx_tcg_events_status').on(table.status),
    typeIdx: index('idx_tcg_events_type').on(table.eventType),
  })
);

/**
 * Event Attendees - Track event registrations and attendance
 */
export const eventAttendees = pgTable(
  'event_attendees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => tcgEvents.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Registration status
    status: text('status', {
      enum: ['registered', 'waitlisted', 'confirmed', 'attended', 'cancelled'],
    })
      .default('registered')
      .notNull(),

    // Role at event
    role: text('role', {
      enum: ['attendee', 'vendor', 'organizer', 'volunteer'],
    })
      .default('attendee')
      .notNull(),

    // Timestamps
    registeredAt: timestamp('registered_at').defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at'),
    attendedAt: timestamp('attended_at'),
  },
  (table) => ({
    eventUserIdx: uniqueIndex('idx_event_attendees_event_user').on(
      table.eventId,
      table.userId
    ),
    eventIdx: index('idx_event_attendees_event').on(table.eventId),
    userIdx: index('idx_event_attendees_user').on(table.userId),
    statusIdx: index('idx_event_attendees_status').on(table.status),
  })
);

/**
 * Event Vendors - Vendors participating in events
 */
export const eventVendors = pgTable(
  'event_vendors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => tcgEvents.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),

    // Booth/table info
    boothNumber: text('booth_number'),
    tableLocation: text('table_location'),

    // What they're bringing
    bringingInventory: boolean('bringing_inventory').default(true).notNull(),
    specialItems: jsonb('special_items').$type<string[]>().default([]),
    featuredCards: jsonb('featured_cards').$type<string[]>().default([]),

    // Status
    status: text('status', {
      enum: ['pending', 'confirmed', 'cancelled'],
    })
      .default('pending')
      .notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    eventVendorIdx: uniqueIndex('idx_event_vendors_event_vendor').on(
      table.eventId,
      table.vendorId
    ),
    eventIdx: index('idx_event_vendors_event').on(table.eventId),
    vendorIdx: index('idx_event_vendors_vendor').on(table.vendorId),
  })
);

// ============================================================================
// COMMUNITY DONATIONS & SHOUTOUTS
// ============================================================================

/**
 * Community Donations - Track card donations and giveaways
 *
 * Enables tracking of vendor/collector generosity for community building.
 * Supports kindness-driven mechanics like free cards for new collectors.
 */
export const communityDonations = pgTable(
  'community_donations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    donorId: text('donor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id').references(() => vendors.id, {
      onDelete: 'set null',
    }),

    // Recipient (optional - for direct donations)
    recipientId: text('recipient_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    recipientName: text('recipient_name'), // For anonymous/non-user recipients

    // Donation type
    donationType: text('donation_type', {
      enum: [
        'card_giveaway',
        'pack_opening',
        'prize_support',
        'charity',
        'new_collector',
        'kid_special',
        'community_event',
      ],
    }).notNull(),

    // What was donated
    cardId: text('card_id').references(() => cards.id, {
      onDelete: 'set null',
    }),
    customDescription: text('custom_description'),
    estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }),
    quantity: integer('quantity').default(1).notNull(),

    // Context
    eventId: uuid('event_id').references(() => tcgEvents.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    story: text('story'), // Heartwarming story behind the donation

    // Verification
    isVerified: boolean('is_verified').default(false).notNull(),
    proofUrl: text('proof_url'), // Image/video proof

    // Visibility
    isPublic: boolean('is_public').default(true).notNull(),
    allowShoutout: boolean('allow_shoutout').default(true).notNull(),

    // Timestamps
    donatedAt: timestamp('donated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    donorIdx: index('idx_community_donations_donor').on(table.donorId),
    vendorIdx: index('idx_community_donations_vendor').on(table.vendorId),
    recipientIdx: index('idx_community_donations_recipient').on(
      table.recipientId
    ),
    typeIdx: index('idx_community_donations_type').on(table.donationType),
    eventIdx: index('idx_community_donations_event').on(table.eventId),
    publicIdx: index('idx_community_donations_public').on(table.isPublic),
  })
);

/**
 * Community Shoutouts - Public recognition for community members
 *
 * Allows users to give shoutouts to vendors, collectors, or community members
 * for positive experiences, fair deals, or acts of kindness.
 */
export const communityShoutouts = pgTable(
  'community_shoutouts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Who is being recognized
    recipientId: text('recipient_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    recipientVendorId: uuid('recipient_vendor_id').references(() => vendors.id, {
      onDelete: 'set null',
    }),
    recipientName: text('recipient_name'), // For non-users

    // Shoutout content
    shoutoutType: text('shoutout_type', {
      enum: [
        'great_deal',
        'fair_pricing',
        'excellent_service',
        'kid_friendly',
        'generous_donation',
        'helpful_advice',
        'community_builder',
        'other',
      ],
    }).notNull(),
    message: text('message').notNull(),

    // Related context
    eventId: uuid('event_id').references(() => tcgEvents.id, {
      onDelete: 'set null',
    }),
    donationId: uuid('donation_id').references(() => communityDonations.id, {
      onDelete: 'set null',
    }),

    // Engagement
    likesCount: integer('likes_count').default(0).notNull(),

    // Moderation
    isApproved: boolean('is_approved').default(true).notNull(),
    reportCount: integer('report_count').default(0).notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index('idx_community_shoutouts_author').on(table.authorId),
    recipientIdx: index('idx_community_shoutouts_recipient').on(
      table.recipientId
    ),
    vendorIdx: index('idx_community_shoutouts_vendor').on(
      table.recipientVendorId
    ),
    typeIdx: index('idx_community_shoutouts_type').on(table.shoutoutType),
    approvedIdx: index('idx_community_shoutouts_approved').on(table.isApproved),
  })
);

// ============================================================================
// ANTI-SCALPING & FAIR PRICING
// ============================================================================

/**
 * Price Alerts - Anti-scalping price monitoring
 *
 * Alerts users when cards are available at fair prices,
 * helping combat scalping and price gouging.
 */
export const fairPriceAlerts = pgTable(
  'fair_price_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),

    // Alert configuration
    maxPrice: decimal('max_price', { precision: 10, scale: 2 }).notNull(),
    preferredConditions: jsonb('preferred_conditions').$type<string[]>(),

    // Fair price reference
    marketPrice: decimal('market_price', { precision: 10, scale: 2 }),
    fairPriceThreshold: real('fair_price_threshold').default(1.2), // 120% of market = fair

    // Notification preferences
    notifyOnFairPrice: boolean('notify_on_fair_price').default(true).notNull(),
    notifyOnRestock: boolean('notify_on_restock').default(false).notNull(),
    preferFairPricingVendors: boolean('prefer_fair_pricing_vendors')
      .default(true)
      .notNull(),

    // Status
    isActive: boolean('is_active').default(true).notNull(),
    triggeredCount: integer('triggered_count').default(0).notNull(),
    lastTriggeredAt: timestamp('last_triggered_at'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userCardIdx: uniqueIndex('idx_fair_price_alerts_user_card').on(
      table.userId,
      table.cardId
    ),
    userIdx: index('idx_fair_price_alerts_user').on(table.userId),
    cardIdx: index('idx_fair_price_alerts_card').on(table.cardId),
    activeIdx: index('idx_fair_price_alerts_active').on(table.isActive),
  })
);

/**
 * Scalping Reports - Community-reported price gouging
 *
 * Allows community to report suspected scalping or unfair pricing
 * for review and potential vendor flagging.
 */
export const scalpingReports = pgTable(
  'scalping_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // What's being reported
    vendorId: uuid('vendor_id').references(() => vendors.id, {
      onDelete: 'set null',
    }),
    inventoryItemId: uuid('inventory_item_id').references(
      () => vendorInventories.id,
      { onDelete: 'set null' }
    ),
    cardId: text('card_id').references(() => cards.id, {
      onDelete: 'set null',
    }),

    // Report details
    reportType: text('report_type', {
      enum: [
        'price_gouging',
        'artificial_scarcity',
        'misleading_condition',
        'fake_listing',
        'bot_buying',
        'other',
      ],
    }).notNull(),
    reportedPrice: decimal('reported_price', { precision: 10, scale: 2 }),
    marketPrice: decimal('market_price', { precision: 10, scale: 2 }),
    description: text('description').notNull(),
    evidenceUrls: jsonb('evidence_urls').$type<string[]>().default([]),

    // Review status
    status: text('status', {
      enum: ['pending', 'investigating', 'confirmed', 'dismissed'],
    })
      .default('pending')
      .notNull(),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    reviewNotes: text('review_notes'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    reporterIdx: index('idx_scalping_reports_reporter').on(table.reporterId),
    vendorIdx: index('idx_scalping_reports_vendor').on(table.vendorId),
    statusIdx: index('idx_scalping_reports_status').on(table.status),
    typeIdx: index('idx_scalping_reports_type').on(table.reportType),
  })
);

// ============================================================================
// KID-FRIENDLY GUIDES
// ============================================================================

/**
 * Collector Guides - Educational content for new collectors (especially kids)
 *
 * Stores kid-friendly guides, tips, and educational content
 * to help new collectors get started without breaking the bank.
 */
export const collectorGuides = pgTable(
  'collector_guides',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id').references(() => vendors.id, {
      onDelete: 'set null',
    }),

    // Guide content
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    summary: text('summary'),
    content: text('content').notNull(), // Markdown

    // Categorization
    guideType: text('guide_type', {
      enum: [
        'getting_started',
        'budget_collecting',
        'grading_101',
        'spotting_fakes',
        'storage_tips',
        'trading_etiquette',
        'event_guide',
        'parent_guide',
      ],
    }).notNull(),
    targetGame: text('target_game', {
      enum: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'one_piece', 'general'],
    }).default('general'),
    targetAudience: text('target_audience', {
      enum: ['kids', 'teens', 'adults', 'parents', 'all'],
    }).default('all'),
    difficultyLevel: text('difficulty_level', {
      enum: ['beginner', 'intermediate', 'advanced'],
    }).default('beginner'),

    // Budget-conscious indicators
    budgetFriendly: boolean('budget_friendly').default(false).notNull(),
    maxBudgetSuggestion: decimal('max_budget_suggestion', {
      precision: 10,
      scale: 2,
    }),

    // Media
    coverImageUrl: text('cover_image_url'),
    videoUrl: text('video_url'),

    // Status and engagement
    status: text('status', {
      enum: ['draft', 'published', 'archived'],
    })
      .default('draft')
      .notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    helpfulCount: integer('helpful_count').default(0).notNull(),

    // RAG metadata for personalized recommendations
    ragTags: jsonb('rag_tags').$type<string[]>().default([]),

    // Timestamps
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('idx_collector_guides_slug').on(table.slug),
    authorIdx: index('idx_collector_guides_author').on(table.authorId),
    typeIdx: index('idx_collector_guides_type').on(table.guideType),
    audienceIdx: index('idx_collector_guides_audience').on(table.targetAudience),
    statusIdx: index('idx_collector_guides_status').on(table.status),
    budgetIdx: index('idx_collector_guides_budget').on(table.budgetFriendly),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  user: one(users, {
    fields: [vendors.userId],
    references: [users.id],
  }),
  inventories: many(vendorInventories),
  events: many(tcgEvents),
  eventParticipations: many(eventVendors),
  donations: many(communityDonations),
  shoutoutsReceived: many(communityShoutouts),
  guides: many(collectorGuides),
  scalpingReports: many(scalpingReports),
}));

export const vendorInventoriesRelations = relations(
  vendorInventories,
  ({ one }) => ({
    vendor: one(vendors, {
      fields: [vendorInventories.vendorId],
      references: [vendors.id],
    }),
    card: one(cards, {
      fields: [vendorInventories.cardId],
      references: [cards.id],
    }),
  })
);

export const tcgEventsRelations = relations(tcgEvents, ({ one, many }) => ({
  creator: one(users, {
    fields: [tcgEvents.creatorId],
    references: [users.id],
  }),
  primaryVendor: one(vendors, {
    fields: [tcgEvents.vendorId],
    references: [vendors.id],
  }),
  attendees: many(eventAttendees),
  vendors: many(eventVendors),
  donations: many(communityDonations),
  shoutouts: many(communityShoutouts),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(tcgEvents, {
    fields: [eventAttendees.eventId],
    references: [tcgEvents.id],
  }),
  user: one(users, {
    fields: [eventAttendees.userId],
    references: [users.id],
  }),
}));

export const eventVendorsRelations = relations(eventVendors, ({ one }) => ({
  event: one(tcgEvents, {
    fields: [eventVendors.eventId],
    references: [tcgEvents.id],
  }),
  vendor: one(vendors, {
    fields: [eventVendors.vendorId],
    references: [vendors.id],
  }),
}));

export const communityDonationsRelations = relations(
  communityDonations,
  ({ one, many }) => ({
    donor: one(users, {
      fields: [communityDonations.donorId],
      references: [users.id],
    }),
    vendor: one(vendors, {
      fields: [communityDonations.vendorId],
      references: [vendors.id],
    }),
    recipient: one(users, {
      fields: [communityDonations.recipientId],
      references: [users.id],
    }),
    card: one(cards, {
      fields: [communityDonations.cardId],
      references: [cards.id],
    }),
    event: one(tcgEvents, {
      fields: [communityDonations.eventId],
      references: [tcgEvents.id],
    }),
    shoutouts: many(communityShoutouts),
  })
);

export const communityShoutoutsRelations = relations(
  communityShoutouts,
  ({ one }) => ({
    author: one(users, {
      fields: [communityShoutouts.authorId],
      references: [users.id],
    }),
    recipient: one(users, {
      fields: [communityShoutouts.recipientId],
      references: [users.id],
    }),
    recipientVendor: one(vendors, {
      fields: [communityShoutouts.recipientVendorId],
      references: [vendors.id],
    }),
    event: one(tcgEvents, {
      fields: [communityShoutouts.eventId],
      references: [tcgEvents.id],
    }),
    donation: one(communityDonations, {
      fields: [communityShoutouts.donationId],
      references: [communityDonations.id],
    }),
  })
);

export const fairPriceAlertsRelations = relations(fairPriceAlerts, ({ one }) => ({
  user: one(users, {
    fields: [fairPriceAlerts.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [fairPriceAlerts.cardId],
    references: [cards.id],
  }),
}));

export const scalpingReportsRelations = relations(scalpingReports, ({ one }) => ({
  reporter: one(users, {
    fields: [scalpingReports.reporterId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [scalpingReports.vendorId],
    references: [vendors.id],
  }),
  inventoryItem: one(vendorInventories, {
    fields: [scalpingReports.inventoryItemId],
    references: [vendorInventories.id],
  }),
  card: one(cards, {
    fields: [scalpingReports.cardId],
    references: [cards.id],
  }),
}));

export const collectorGuidesRelations = relations(collectorGuides, ({ one }) => ({
  author: one(users, {
    fields: [collectorGuides.authorId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [collectorGuides.vendorId],
    references: [vendors.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type VendorInventory = typeof vendorInventories.$inferSelect;
export type NewVendorInventory = typeof vendorInventories.$inferInsert;
export type TcgEvent = typeof tcgEvents.$inferSelect;
export type NewTcgEvent = typeof tcgEvents.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type NewEventAttendee = typeof eventAttendees.$inferInsert;
export type EventVendor = typeof eventVendors.$inferSelect;
export type NewEventVendor = typeof eventVendors.$inferInsert;
export type CommunityDonation = typeof communityDonations.$inferSelect;
export type NewCommunityDonation = typeof communityDonations.$inferInsert;
export type CommunityShoutout = typeof communityShoutouts.$inferSelect;
export type NewCommunityShoutout = typeof communityShoutouts.$inferInsert;
export type FairPriceAlert = typeof fairPriceAlerts.$inferSelect;
export type NewFairPriceAlert = typeof fairPriceAlerts.$inferInsert;
export type ScalpingReport = typeof scalpingReports.$inferSelect;
export type NewScalpingReport = typeof scalpingReports.$inferInsert;
export type CollectorGuide = typeof collectorGuides.$inferSelect;
export type NewCollectorGuide = typeof collectorGuides.$inferInsert;
