-- GA4 AI Referral Traffic Analysis
-- BigQuery SQL for analyzing sessions from AI chatbots and assistants
--
-- SETUP INSTRUCTIONS:
-- 1. Replace `PROJECT.DATASET.events_*` with your GA4 BigQuery export table
-- 2. Adjust the date range in _TABLE_SUFFIX (format: YYYYMMDD)
-- 3. Run in BigQuery console or schedule as a saved query

-- =============================================================================
-- QUERY 1: AI Sessions by Source and Medium
-- =============================================================================
-- This query identifies all sessions originating from AI platforms,
-- grouped by traffic source and medium.

SELECT
  traffic_source.source AS source,
  traffic_source.medium AS medium,
  COUNTIF(event_name = 'session_start') AS sessions,
  COUNT(DISTINCT user_pseudo_id) AS unique_users,
  COUNTIF(event_name = 'page_view') AS page_views,
  -- Calculate average pages per session
  SAFE_DIVIDE(
    COUNTIF(event_name = 'page_view'),
    COUNTIF(event_name = 'session_start')
  ) AS avg_pages_per_session
FROM
  `PROJECT.DATASET.events_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20250101' AND '20251231'
  AND REGEXP_CONTAINS(
    LOWER(traffic_source.source),
    r'(chatgpt|openai|claude|anthropic|poe|perplexity|phind|grok|x\.ai|gemini|bard|copilot)'
  )
GROUP BY
  1, 2
ORDER BY
  sessions DESC;


-- =============================================================================
-- QUERY 2: AI Sessions with Engagement Metrics
-- =============================================================================
-- This query adds engagement metrics like engaged sessions and session duration.

SELECT
  traffic_source.source AS source,
  traffic_source.medium AS medium,
  COUNTIF(event_name = 'session_start') AS sessions,
  COUNT(DISTINCT user_pseudo_id) AS unique_users,

  -- Engaged sessions (GA4 definition: >10s OR 2+ pages OR conversion)
  COUNTIF(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_engaged') = 1
  ) AS engaged_sessions,

  -- Engagement rate
  SAFE_DIVIDE(
    COUNTIF((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_engaged') = 1),
    COUNTIF(event_name = 'session_start')
  ) AS engagement_rate,

  -- Average engagement time (in seconds)
  ROUND(
    AVG(
      (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec')
    ) / 1000,
    2
  ) AS avg_engagement_time_sec

FROM
  `PROJECT.DATASET.events_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20250101' AND '20251231'
  AND REGEXP_CONTAINS(
    LOWER(traffic_source.source),
    r'(chatgpt|openai|claude|anthropic|poe|perplexity|phind|grok|x\.ai|gemini|bard|copilot)'
  )
GROUP BY
  1, 2
ORDER BY
  sessions DESC;


-- =============================================================================
-- QUERY 3: AI Sessions with Conversions
-- =============================================================================
-- This query tracks conversion events from AI referral sessions.
-- Customize the conversion event names to match your GA4 setup.

SELECT
  traffic_source.source AS source,
  traffic_source.medium AS medium,
  COUNTIF(event_name = 'session_start') AS sessions,

  -- Count specific conversion events (customize these)
  COUNTIF(event_name = 'purchase') AS purchases,
  COUNTIF(event_name = 'sign_up') AS sign_ups,
  COUNTIF(event_name = 'generate_lead') AS leads,

  -- Total conversions (all conversion-marked events)
  COUNTIF(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'is_conversion') = 1
  ) AS total_conversions,

  -- Conversion rate
  SAFE_DIVIDE(
    COUNTIF((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'is_conversion') = 1),
    COUNTIF(event_name = 'session_start')
  ) AS conversion_rate,

  -- Revenue (if e-commerce is tracked)
  SUM(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'value')
  ) / 1000000 AS total_revenue_usd

FROM
  `PROJECT.DATASET.events_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20250101' AND '20251231'
  AND REGEXP_CONTAINS(
    LOWER(traffic_source.source),
    r'(chatgpt|openai|claude|anthropic|poe|perplexity|phind|grok|x\.ai|gemini|bard|copilot)'
  )
GROUP BY
  1, 2
ORDER BY
  sessions DESC;


-- =============================================================================
-- QUERY 4: Daily AI Traffic Trends
-- =============================================================================
-- This query shows AI referral traffic trends over time.

SELECT
  PARSE_DATE('%Y%m%d', event_date) AS date,
  traffic_source.source AS source,
  COUNTIF(event_name = 'session_start') AS sessions,
  COUNT(DISTINCT user_pseudo_id) AS unique_users
FROM
  `PROJECT.DATASET.events_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20250101' AND '20251231'
  AND REGEXP_CONTAINS(
    LOWER(traffic_source.source),
    r'(chatgpt|openai|claude|anthropic|poe|perplexity|phind|grok|x\.ai|gemini|bard|copilot)'
  )
GROUP BY
  1, 2
ORDER BY
  date DESC, sessions DESC;


-- =============================================================================
-- QUERY 5: Landing Pages from AI Referrals
-- =============================================================================
-- This query identifies which pages AI users land on most frequently.

SELECT
  traffic_source.source AS ai_source,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS landing_page,
  COUNTIF(event_name = 'session_start') AS sessions,
  COUNT(DISTINCT user_pseudo_id) AS unique_users,

  -- Bounce rate approximation
  SAFE_DIVIDE(
    COUNTIF(
      (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec') < 10000
    ),
    COUNTIF(event_name = 'session_start')
  ) AS bounce_rate

FROM
  `PROJECT.DATASET.events_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20250101' AND '20251231'
  AND event_name = 'session_start'
  AND REGEXP_CONTAINS(
    LOWER(traffic_source.source),
    r'(chatgpt|openai|claude|anthropic|poe|perplexity|phind|grok|x\.ai|gemini|bard|copilot)'
  )
GROUP BY
  1, 2
HAVING
  sessions > 10  -- Filter for statistically significant traffic
ORDER BY
  sessions DESC
LIMIT 100;


-- =============================================================================
-- NOTES
-- =============================================================================
--
-- AI Platforms Covered:
-- - ChatGPT / OpenAI: chatgpt, openai
-- - Claude / Anthropic: claude, anthropic
-- - Poe: poe
-- - Perplexity: perplexity
-- - Phind: phind
-- - Grok / xAI: grok, x.ai
-- - Google AI: gemini, bard
-- - Microsoft: bing ai, copilot
--
-- Date Range:
-- - Update _TABLE_SUFFIX dates to match your analysis period
-- - Format: YYYYMMDD (e.g., '20250101' to '20251231')
--
-- Customization:
-- - Add your specific conversion event names in Query 3
-- - Adjust HAVING clauses to filter for minimum session thresholds
-- - Extend regex pattern if new AI platforms emerge
--
-- Performance:
-- - These queries scan daily event tables - costs may apply
-- - Consider creating materialized views for frequently-run queries
-- - Use date partitioning to minimize scanned data
