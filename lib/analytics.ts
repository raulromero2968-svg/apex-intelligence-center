/**
 * Analytics Tracking System
 * Privacy-focused event tracking and conversion funnel analytics
 */

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
};

export type ConversionFunnel =
  | 'newsletter_signup'
  | 'premium_upgrade'
  | 'article_engagement'
  | 'portfolio_view';

class Analytics {
  private enabled: boolean;
  private queue: AnalyticsEvent[] = [];
  private endpoint: string | null = null;

  constructor() {
    this.enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    // In production, this would be your analytics endpoint
    // e.g., Plausible, PostHog, or custom analytics server
    this.endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || null;
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, string | number | boolean>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    if (this.enabled && this.endpoint) {
      this.sendEvent(event);
    } else {
      // Development mode: log to console
      console.log('[Analytics]', event);
    }
  }

  /**
   * Track page views
   */
  pageView(url: string, referrer?: string) {
    this.track('pageview', {
      url,
      referrer: referrer || document.referrer,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });
  }

  /**
   * Track conversion funnel events
   */
  trackFunnel(funnel: ConversionFunnel, step: string, metadata?: Record<string, any>) {
    this.track(`funnel_${funnel}`, {
      step,
      ...metadata,
    });
  }

  /**
   * Track article engagement
   */
  trackArticleEngagement(articleSlug: string, action: 'view' | 'read_time' | 'share' | 'bookmark', value?: number) {
    this.track('article_engagement', {
      article: articleSlug,
      action,
      value: value || 1,
    });
  }

  /**
   * Track newsletter conversions
   */
  trackNewsletterSignup(source: 'modal' | 'inline' | 'sidebar') {
    this.trackFunnel('newsletter_signup', 'completed', { source });
  }

  /**
   * Track premium upgrade flow
   */
  trackPremiumFlow(step: 'view_pricing' | 'click_upgrade' | 'checkout_started' | 'conversion') {
    this.trackFunnel('premium_upgrade', step);
  }

  /**
   * Track portfolio interactions
   */
  trackPortfolioAction(action: 'view' | 'add_asset' | 'remove_asset' | 'export_data') {
    this.track('portfolio_action', { action });
  }

  /**
   * Send event to analytics endpoint
   */
  private async sendEvent(event: AnalyticsEvent) {
    if (!this.endpoint) return;

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        // Use keepalive to ensure event is sent even if user navigates away
        keepalive: true,
      });
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
      this.queue.push(event);
    }
  }

  /**
   * Track time spent on page
   */
  startTimeTracking() {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      this.track('time_on_page', {
        duration: timeSpent,
        url: window.location.pathname,
      });
    };
  }
}

// Export singleton instance
export const analytics = new Analytics();

/**
 * React hook for tracking component lifecycle
 */
export function useAnalytics(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    analytics.track(eventName, properties);
  }
}

/**
 * HOC for tracking page views
 */
export function withPageTracking<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string
) {
  return function TrackedComponent(props: P) {
    if (typeof window !== 'undefined') {
      analytics.pageView(pageName);
    }
    return <Component {...props} />;
  };
}
