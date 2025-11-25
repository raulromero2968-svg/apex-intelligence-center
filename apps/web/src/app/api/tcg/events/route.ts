/**
 * TCG Events API Routes
 *
 * Weather/location-based game events for TCG.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTimeOfDay,
  parseWeatherCondition,
  getWeatherBoosts,
  getLocationAffinities,
  getAllActiveBoosts,
  applyBoostsToCard,
  triggerEvent,
  getActiveEvents,
  completeEvent,
  findNearbyPois,
  determineLocationType,
  WEATHER_EVENTS,
  LOCATION_EVENTS,
  ELEMENT_WEATHER_BOOSTS,
  TIME_OF_DAY_EFFECTS,
  type WeatherData,
  type LocationData,
  type PointOfInterest,
} from '@/lib/tcg-domains';

/**
 * POST /api/tcg/events
 * Event operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'get-boosts': {
        const { weather, location, timestamp } = body as {
          weather: WeatherData;
          location: LocationData;
          timestamp?: string;
        };

        if (!weather || !location) {
          return NextResponse.json(
            { error: 'weather and location required' },
            { status: 400 }
          );
        }

        const time = timestamp ? new Date(timestamp) : new Date();
        const boosts = getAllActiveBoosts(weather, location, time);
        const timeOfDay = getTimeOfDay(time);

        return NextResponse.json({
          success: true,
          timeOfDay,
          boosts,
        });
      }

      case 'apply-boosts': {
        const { baseStats, element, weather, location } = body as {
          baseStats: Record<string, number>;
          element: string;
          weather: WeatherData;
          location: LocationData;
        };

        if (!baseStats || !element || !weather || !location) {
          return NextResponse.json(
            { error: 'baseStats, element, weather, and location required' },
            { status: 400 }
          );
        }

        const boosts = getAllActiveBoosts(weather, location);
        const modifiedStats = applyBoostsToCard(baseStats, element, boosts);

        return NextResponse.json({
          success: true,
          originalStats: baseStats,
          modifiedStats,
          appliedBoosts: boosts.filter((b) => b.elementType === element),
        });
      }

      case 'trigger-event': {
        const { eventId, weather, location } = body as {
          eventId: string;
          weather?: WeatherData;
          location?: LocationData;
        };

        const allEvents = [...WEATHER_EVENTS, ...LOCATION_EVENTS];
        const event = allEvents.find((e) => e.id === eventId);

        if (!event) {
          return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const triggered = triggerEvent(event, { weather, location });

        if (!triggered) {
          return NextResponse.json({
            success: false,
            message: 'Event trigger conditions not met',
          });
        }

        return NextResponse.json({
          success: true,
          event: triggered,
        });
      }

      case 'complete-event': {
        const { eventId } = body;

        if (!eventId) {
          return NextResponse.json({ error: 'eventId required' }, { status: 400 });
        }

        const rewards = completeEvent(eventId);

        if (!rewards) {
          return NextResponse.json({ error: 'Event not found or not active' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          rewards,
        });
      }

      case 'parse-weather': {
        const { temperature, humidity, windSpeed, precipitation, cloudCover } = body;

        const condition = parseWeatherCondition({
          temperature: temperature ?? 20,
          humidity: humidity ?? 50,
          windSpeed: windSpeed ?? 10,
          precipitation: precipitation ?? 0,
          cloudCover: cloudCover ?? 30,
        });

        const weatherData: WeatherData = {
          condition,
          temperature: temperature ?? 20,
          humidity: humidity ?? 50,
          windSpeed: windSpeed ?? 10,
          precipitation: precipitation ?? 0,
          visibility: 10,
          timestamp: new Date(),
        };

        const boosts = getWeatherBoosts(weatherData);

        return NextResponse.json({
          success: true,
          weather: weatherData,
          boosts,
        });
      }

      case 'find-pois': {
        const { location, pois, maxDistance } = body as {
          location: LocationData;
          pois: PointOfInterest[];
          maxDistance?: number;
        };

        if (!location || !pois) {
          return NextResponse.json(
            { error: 'location and pois required' },
            { status: 400 }
          );
        }

        const nearby = findNearbyPois(location, pois, maxDistance ?? 5);

        return NextResponse.json({
          success: true,
          nearbyPois: nearby,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing event request:', error);
    return NextResponse.json(
      { error: 'Failed to process event request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tcg/events
 * Get event info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    switch (type) {
      case 'active':
        return NextResponse.json({
          success: true,
          events: getActiveEvents(),
        });

      case 'weather-events':
        return NextResponse.json({
          success: true,
          events: WEATHER_EVENTS,
        });

      case 'location-events':
        return NextResponse.json({
          success: true,
          events: LOCATION_EVENTS,
        });

      case 'all-events':
        return NextResponse.json({
          success: true,
          weatherEvents: WEATHER_EVENTS,
          locationEvents: LOCATION_EVENTS,
        });

      case 'weather-boosts':
        return NextResponse.json({
          success: true,
          boosts: ELEMENT_WEATHER_BOOSTS,
        });

      case 'time-effects':
        return NextResponse.json({
          success: true,
          effects: TIME_OF_DAY_EFFECTS,
          currentTimeOfDay: getTimeOfDay(),
        });

      case 'location-type':
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const locationType = determineLocationType(lat, lng);

        return NextResponse.json({
          success: true,
          latitude: lat,
          longitude: lng,
          locationType,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching event info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event info' },
      { status: 500 }
    );
  }
}
