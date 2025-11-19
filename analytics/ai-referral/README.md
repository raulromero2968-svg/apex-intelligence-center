# GA4 AI Referral Traffic Analysis

This guide provides step-by-step instructions for tracking and analyzing referral traffic from AI chatbots and assistants using Google Analytics 4.

## Overview

AI platforms like ChatGPT, Claude, Perplexity, and others are becoming significant traffic sources. This exploration helps you measure engagement and conversions from these AI referrals.

## GA4 Free Form Exploration Setup

### Step 1: Create a New Exploration

1. Navigate to **Explore** in the left sidebar of Google Analytics 4
2. Click **Create a new exploration**
3. Select **Free form** template
4. Name your exploration: "AI Referral Traffic Analysis"

### Step 2: Configure Dimensions

1. In the **Variables** panel on the left, under **Dimensions**:
   - Click the **+** button next to "Dimensions"
   - Search for and add:
     - `Session source`
     - `Session medium`
2. Drag both dimensions into the **Rows** section in the Tab Settings panel

### Step 3: Configure Metrics

1. In the **Variables** panel, under **Metrics**:
   - Click the **+** button next to "Metrics"
   - Search for and add:
     - `Views` (or `Screenviews` for apps)
     - `Engaged sessions`
     - `Conversions` (total conversions)
2. Drag all three metrics into the **Values** section in the Tab Settings panel

### Step 4: Apply AI Source Filter

1. In the **Tab Settings** panel, locate the **Filters** section
2. Click **Add filter**
3. Configure the filter:
   - **Dimension**: Select `Session source`
   - **Match type**: Select `matches regex`
   - **Expression**: Enter the following regex pattern:

```
(chatgpt|openai|claude|anthropic|poe|perplexity|phind|grok|x\.ai|gemini|bard|bing ai|copilot)
```

4. Click **Apply**

### Step 5: Refine and Analyze

Optional refinements:

1. **Date Range**: Adjust the date range in the top right to match your analysis period
2. **Secondary Dimension**: Add `Landing page` or `Device category` for deeper insights
3. **Sorting**: Click column headers to sort by metrics (e.g., highest conversions)
4. **Segments**: Apply user segments to compare AI referral behavior vs. other traffic

## AI Source Regex Pattern

The filter uses this regex pattern to identify AI platform referrals:

```regex
(chatgpt|openai|claude|anthropic|poe|perplexity|phind|grok|x\.ai|gemini|bard|bing ai|copilot)
```

### Covered AI Platforms:
- **ChatGPT / OpenAI**: chatgpt, openai
- **Claude / Anthropic**: claude, anthropic
- **Poe**: poe
- **Perplexity**: perplexity
- **Phind**: phind
- **Grok / xAI**: grok, x.ai
- **Google AI**: gemini, bard
- **Microsoft**: bing ai, copilot

## Interpreting Results

### Key Metrics

- **Views**: Total page/screen views from AI referrals
- **Engaged sessions**: Sessions lasting >10 seconds, with conversion event, or 2+ page views
- **Conversions**: Goal completions (purchases, sign-ups, etc.)

### What to Look For

1. **Engagement Rate**: `Engaged sessions / Total sessions` - Are AI referrals high quality?
2. **Conversion Rate**: `Conversions / Sessions` - Do AI users convert?
3. **Top AI Sources**: Which platforms drive the most valuable traffic?
4. **Trends**: Is AI traffic growing month-over-month?

## Exporting Data

1. Click the **Download** icon (⬇) in the top right
2. Choose format: PDF, CSV, Google Sheets, or TSV
3. Use for reporting or further analysis

## Related Resources

- See `/analytics/ai-referral/ai-referral.sql` for BigQuery analysis
- For implementation details, check GA4 documentation on custom explorations

## Troubleshooting

**No data showing?**
- Verify your date range includes recent traffic
- Check that GA4 is properly tracking `session_start` events
- Confirm AI platforms are actually referring traffic (check Acquisition reports)

**Unexpected sources appearing?**
- Review the regex pattern - you may need to escape special characters
- Consider adding exclusion filters for false positives

---

*Last updated: 2025-11-19*
