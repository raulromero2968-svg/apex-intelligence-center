/**
 * TCG Community Events API Routes
 *
 * Manages TCG events including conventions, local shop events,
 * pop-ups, and online gatherings. Supports vendor participation
 * and attendee registration.
 *
 * @see knowledge-09-database-architecture
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { eq, and, desc, gte, lte, sql, ilike, or } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  handleApiError,
} from '@/lib/errors';
import { z } from 'zod';
import {
  tcgEvents,
  eventAttendees,
  eventVendors,
  vendors,
  type TcgEvent,
  type NewTcgEvent,
} from '@/db/schema/tcg-community';

const eventFeaturesSchema = z.object({
  hasVending: z.boolean().optional(),
  hasTournament: z.boolean().optional(),
  hasPackOpening: z.boolean().optional(),
  hasTrading: z.boolean().optional(),
  hasGiveaways: z.boolean().optional(),
  hasMeetAndGreet: z.boolean().optional(),
  kidFriendly: z.boolean().optional(),
  freeEntry: z.boolean().optional(),
  entryFee: z.number().optional(),
});

const createEventSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional(),
  eventType: z.enum([
    'convention',
    'local_shop',
    'pop_up',
    'online',
    'meetup',
    'tournament',
    'pack_opening',
  ]),
  venueName: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default('US'),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  timezone: z.string().default('America/New_York'),
  isAllDay: z.boolean().default(false),
  maxAttendees: z.number().int().positive().optional(),
  requiresRegistration: z.boolean().default(false),
  registrationUrl: z.string().url().optional(),
  features: eventFeaturesSchema.optional(),
  featuredGames: z.array(z.string()).optional(),
  coverImageUrl: z.string().url().optional(),
  externalUrl: z.string().url().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).default('draft'),
});

const updateEventSchema = createEventSchema.partial();

/**
 * GET /api/tcg/community/events
 * Get TCG events with filtering
 *
 * Query params:
 * - id: Get specific event
 * - mine: Get events created by authenticated user
 * - attending: Get events user is attending
 * - city/state/country: Location filters
 * - game: Filter by featured game
 * - type: Filter by event type
 * - startAfter/startBefore: Date range
 * - kidFriendly: Filter for family-friendly events
 * - upcoming: Only future events (default true)
 * - limit/offset: Pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const mine = searchParams.get('mine');
    const attending = searchParams.get('attending');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const country = searchParams.get('country');
    const game = searchParams.get('game');
    const eventType = searchParams.get('type');
    const startAfter = searchParams.get('startAfter');
    const startBefore = searchParams.get('startBefore');
    const kidFriendly = searchParams.get('kidFriendly');
    const upcoming = searchParams.get('upcoming') !== 'false';
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get specific event
    if (id) {
      const event = await db.query.tcgEvents.findFirst({
        where: eq(tcgEvents.id, id),
        with: {
          creator: {
            columns: { id: true, name: true },
          },
          primaryVendor: true,
          attendees: {
            where: eq(eventAttendees.status, 'confirmed'),
          },
          vendors: {
            with: {
              vendor: true,
            },
          },
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      return Response.json({ event });
    }

    // Build query conditions
    const conditions = [eq(tcgEvents.status, 'published')];

    // Filter by creator
    if (mine === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }
      conditions.pop(); // Remove published filter for own events
      conditions.push(eq(tcgEvents.creatorId, user.id));
    }

    // Filter by attendance
    if (attending === 'true') {
      const user = await getUserFromRequest(req);
      if (!user) {
        throw new AuthenticationError();
      }

      const attendedEvents = await db.query.eventAttendees.findMany({
        where: and(
          eq(eventAttendees.userId, user.id),
          or(
            eq(eventAttendees.status, 'registered'),
            eq(eventAttendees.status, 'confirmed')
          )
        ),
        columns: { eventId: true },
      });

      const eventIds = attendedEvents.map((a) => a.eventId);
      if (eventIds.length === 0) {
        return Response.json({ events: [], count: 0, total: 0, limit, offset });
      }

      conditions.push(
        sql`${tcgEvents.id} = ANY(ARRAY[${sql.join(eventIds.map(id => sql`${id}::uuid`), sql`, `)}])`
      );
    }

    // Location filters
    if (city) {
      conditions.push(ilike(tcgEvents.city, `%${city}%`));
    }
    if (state) {
      conditions.push(eq(tcgEvents.state, state));
    }
    if (country) {
      conditions.push(eq(tcgEvents.country, country));
    }

    // Event type filter
    if (eventType) {
      conditions.push(eq(tcgEvents.eventType, eventType as TcgEvent['eventType']));
    }

    // Date range filters
    if (upcoming) {
      conditions.push(gte(tcgEvents.startDate, new Date()));
    }
    if (startAfter) {
      conditions.push(gte(tcgEvents.startDate, new Date(startAfter)));
    }
    if (startBefore) {
      conditions.push(lte(tcgEvents.startDate, new Date(startBefore)));
    }

    // Search
    if (search) {
      conditions.push(
        or(
          ilike(tcgEvents.name, `%${search}%`),
          ilike(tcgEvents.description || '', `%${search}%`),
          ilike(tcgEvents.venueName || '', `%${search}%`)
        )
      );
    }

    // Execute query
    const events = await db.query.tcgEvents.findMany({
      where: and(...conditions),
      orderBy: [desc(tcgEvents.startDate)],
      limit,
      offset,
      with: {
        creator: {
          columns: { id: true, name: true },
        },
        primaryVendor: {
          columns: { id: true, name: true },
        },
      },
    });

    // Filter by kid-friendly if specified (post-query for JSONB)
    let filteredEvents = events;
    if (kidFriendly === 'true') {
      filteredEvents = events.filter((e) => e.features?.kidFriendly === true);
    }

    // Filter by game (post-query for JSONB array)
    if (game) {
      filteredEvents = filteredEvents.filter((e) =>
        e.featuredGames?.includes(game)
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tcgEvents)
      .where(and(...conditions));

    return Response.json({
      events: filteredEvents,
      count: filteredEvents.length,
      total: countResult[0]?.count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/tcg/community/events
 * Create a new TCG event
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    // Validate request body
    const body = await req.json();
    const validated = createEventSchema.parse(body);

    // Check if user has a vendor profile (optional, for vendor-associated events)
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.userId, user.id),
    });

    // Create event
    const [newEvent] = await db
      .insert(tcgEvents)
      .values({
        creatorId: user.id,
        vendorId: vendor?.id,
        ...validated,
        featuredGames: validated.featuredGames || [],
      } as NewTcgEvent)
      .returning();

    // Auto-register creator as organizer
    await db.insert(eventAttendees).values({
      eventId: newEvent.id,
      userId: user.id,
      status: 'confirmed',
      role: 'organizer',
    });

    // If creator is a vendor, auto-add as event vendor
    if (vendor) {
      await db.insert(eventVendors).values({
        eventId: newEvent.id,
        vendorId: vendor.id,
        status: 'confirmed',
      });
    }

    return Response.json(
      {
        event: newEvent,
        created: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * PATCH /api/tcg/community/events
 * Update an event
 *
 * Query params:
 * - id: Event ID to update
 * - action: Special actions (register, unregister, addVendor)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('id');
    const action = searchParams.get('action');

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Get event
    const event = await db.query.tcgEvents.findFirst({
      where: eq(tcgEvents.id, eventId),
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Handle special actions
    if (action === 'register') {
      // Check capacity
      if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        throw new ValidationError('Event is at capacity');
      }

      // Check if already registered
      const existing = await db.query.eventAttendees.findFirst({
        where: and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, user.id)
        ),
      });

      if (existing) {
        throw new ValidationError('Already registered for this event');
      }

      // Register
      await db.insert(eventAttendees).values({
        eventId,
        userId: user.id,
        status: event.requiresRegistration ? 'registered' : 'confirmed',
        role: 'attendee',
      });

      // Update attendee count
      await db
        .update(tcgEvents)
        .set({ currentAttendees: event.currentAttendees + 1 })
        .where(eq(tcgEvents.id, eventId));

      return Response.json({ registered: true, eventId });
    }

    if (action === 'unregister') {
      const attendance = await db.query.eventAttendees.findFirst({
        where: and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, user.id)
        ),
      });

      if (!attendance) {
        throw new NotFoundError('Not registered for this event');
      }

      await db
        .delete(eventAttendees)
        .where(eq(eventAttendees.id, attendance.id));

      // Update attendee count
      await db
        .update(tcgEvents)
        .set({ currentAttendees: Math.max(0, event.currentAttendees - 1) })
        .where(eq(tcgEvents.id, eventId));

      return Response.json({ unregistered: true, eventId });
    }

    if (action === 'addVendor') {
      // Get user's vendor profile
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.userId, user.id),
      });

      if (!vendor) {
        throw new NotFoundError('Vendor profile required');
      }

      // Check if already added
      const existing = await db.query.eventVendors.findFirst({
        where: and(
          eq(eventVendors.eventId, eventId),
          eq(eventVendors.vendorId, vendor.id)
        ),
      });

      if (existing) {
        throw new ValidationError('Already registered as vendor for this event');
      }

      const body = await req.json();

      await db.insert(eventVendors).values({
        eventId,
        vendorId: vendor.id,
        boothNumber: body.boothNumber,
        tableLocation: body.tableLocation,
        specialItems: body.specialItems || [],
        featuredCards: body.featuredCards || [],
        status: 'pending',
      });

      return Response.json({ vendorAdded: true, eventId });
    }

    // Regular update - verify ownership
    if (event.creatorId !== user.id) {
      throw new AuthorizationError('You can only update your own events');
    }

    const body = await req.json();
    const validated = updateEventSchema.parse(body);

    const [updatedEvent] = await db
      .update(tcgEvents)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(tcgEvents.id, eventId))
      .returning();

    return Response.json({
      event: updatedEvent,
      updated: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new ValidationError(error.errors[0].message));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tcg/community/events
 * Delete an event (creator only)
 *
 * Query params:
 * - id: Event ID to delete
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      throw new ValidationError('Event ID is required');
    }

    // Get event
    const event = await db.query.tcgEvents.findFirst({
      where: eq(tcgEvents.id, eventId),
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.creatorId !== user.id) {
      throw new AuthorizationError('You can only delete your own events');
    }

    // Delete event (cascades to attendees and vendors)
    await db.delete(tcgEvents).where(eq(tcgEvents.id, eventId));

    return Response.json({
      deleted: true,
      id: eventId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
