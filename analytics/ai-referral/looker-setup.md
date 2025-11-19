# GA4 & Looker Studio Setup: AI Referral Traffic

This guide walks through creating a saved GA4 Exploration for AI Referral Traffic and setting up a Looker Studio dashboard to monitor AI-driven traffic sources.

---

## Part 1: GA4 Exploration - "AI Referral Traffic"

### Step 1: Access GA4 Explorations

1. Log into [Google Analytics 4](https://analytics.google.com/)
2. Select your property (Apex Intelligence Center)
3. In the left sidebar, click **Explore** (chart icon)
4. Click **Create a new exploration** or use a blank template

**[Screenshot: GA4 Navigation to Explore]**

---

### Step 2: Configure Exploration Template

1. **Name your exploration**: "AI Referral Traffic"
2. **Select template**: Start with **"Free form"** for maximum flexibility
3. Set date range: Last 30 days (or custom range as needed)

**[Screenshot: Exploration template selection]**

---

### Step 3: Add Dimensions

In the **Variables** panel on the left, add the following dimensions:

#### Primary Dimensions:
- **Session source** (`sessionSource`)
- **Session medium** (`sessionMedium`)
- **Session source/medium** (`sessionSourceMedium`)
- **Page path and screen class** (`pagePath`)
- **Landing page** (`landingPage`)
- **Device category** (`deviceCategory`)
- **Country** (`country`)

**[Screenshot: Adding dimensions in Variables panel]**

---

### Step 4: Add Metrics

Add the following metrics to track AI referral performance:

#### Key Metrics:
- **Sessions** (`sessions`)
- **Engaged sessions** (`engagedSessions`)
- **Engagement rate** (`engagementRate`)
- **Users** (`totalUsers`)
- **New users** (`newUsers`)
- **Conversions** (`conversions`)
- **Event count** (`eventCount`)
- **Average engagement time** (`averageEngagementTime`)
- **Bounce rate** (`bounceRate`)

**[Screenshot: Adding metrics in Variables panel]**

---

### Step 5: Create AI Referral Filter

This is the critical step to isolate AI-generated traffic.

#### Create Segment Filter:

1. Click **"+"** next to **Segments** in the Variables panel
2. Select **"Create a custom segment"**
3. Name it: **"AI Referral Traffic"**
4. Set scope to **"Session"**
5. Add condition:
   - Dimension: **Session source**
   - Match type: **"matches regex"**
   - Value: Use the AI referral regex pattern below

#### AI Referral Regex Pattern:

```regex
(chat\.openai\.com|chatgpt\.com|claude\.ai|anthropic\.com|perplexity\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|bing\.com/chat|you\.com|phind\.com|poe\.com|character\.ai|forefront\.ai|writesonic\.com|jasper\.ai|sharegpt\.com|venice\.ai|grok\.x\.com|meta\.ai|pi\.ai|inflection\.ai|mistral\.ai|huggingface\.co/chat|cohere\.com|together\.ai|deepseek\.com)
```

#### Alternative: Individual AI Platform Filters

If you want to track specific platforms separately, create individual segments for:

- **ChatGPT**: `(chat\.openai\.com|chatgpt\.com)`
- **Claude**: `(claude\.ai|anthropic\.com)`
- **Perplexity**: `perplexity\.ai`
- **Gemini/Bard**: `(gemini\.google\.com|bard\.google\.com)`
- **Microsoft Copilot**: `(copilot\.microsoft\.com|bing\.com/chat)`
- **You.com**: `you\.com`
- **Grok**: `grok\.x\.com`
- **Meta AI**: `meta\.ai`
- **Pi**: `(pi\.ai|inflection\.ai)`

**[Screenshot: Segment configuration with regex filter]**

---

### Step 6: Build the Exploration Report

#### Tab Settings:

1. **Technique**: Free form (table)
2. **Rows**:
   - Session source/medium (primary)
   - Landing page (secondary)
3. **Values**:
   - Sessions
   - Users
   - Engagement rate
   - Conversions
   - Average engagement time
4. **Filters**: Apply the "AI Referral Traffic" segment

#### Optional Secondary Tab - Time Series:

1. Create a second tab: "AI Traffic Over Time"
2. **Technique**: Line chart
3. **Breakdown**: Date
4. **Values**: Sessions, Users, Engagement rate
5. **Segment**: AI Referral Traffic

**[Screenshot: Completed exploration with data table]**

---

### Step 7: Save the Exploration

1. Click the **Save** button (top right)
2. Verify name: "AI Referral Traffic"
3. Click **Save** to confirm
4. The exploration will be available under **Explore > All explorations**

**[Screenshot: Saved exploration in explorations library]**

---

## Part 2: Looker Studio Dashboard Setup

### Step 1: Create New Looker Studio Report

1. Navigate to [Looker Studio](https://lookerstudio.google.com/)
2. Click **Create** → **Report**
3. Name it: "Apex Intelligence Center - AI Referral Dashboard"

**[Screenshot: Looker Studio new report creation]**

---

### Step 2: Connect GA4 Data Source

1. Click **Add data** → **Google Analytics**
2. Select **"Google Analytics 4"** (not Universal Analytics)
3. Choose your GA4 property: **Apex Intelligence Center**
4. Authorize the connection
5. Click **Add** to confirm

**[Screenshot: GA4 data source connection]**

---

### Step 3: Create AI Referral Filter in Looker Studio

Since we need to filter data in Looker Studio:

1. Click **Add a control** → **Drop-down list**
2. Set control field: **Session source**
3. Configure **Data** panel:
   - Metric: Session source
   - Filter: Create filter with regex (see below)

#### Looker Studio Filter Setup:

1. Click **Add a filter** (data panel)
2. Name: "AI Referral Sources"
3. **Include** → **Session source** → **Matches regex**
4. Paste the regex:

```regex
(chat\.openai\.com|chatgpt\.com|claude\.ai|anthropic\.com|perplexity\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|bing\.com/chat|you\.com|phind\.com|poe\.com|character\.ai|forefront\.ai|writesonic\.com|jasper\.ai|sharegpt\.com|venice\.ai|grok\.x\.com|meta\.ai|pi\.ai|inflection\.ai|mistral\.ai|huggingface\.co/chat|cohere\.com|together\.ai|deepseek\.com)
```

**[Screenshot: Filter configuration in Looker Studio]**

---

### Step 4: Build Dashboard Components

Create the following visualizations:

#### 1. Scorecard Panel (Top Row):

Add 4 scorecards with these metrics:
- **Total Sessions** (from AI referrals)
- **Total Users** (from AI referrals)
- **Engagement Rate** (percentage)
- **Conversions** (total conversions from AI traffic)

**Filter**: Apply "AI Referral Sources" filter to all scorecards

**[Screenshot: Scorecard panel with key metrics]**

---

#### 2. AI Traffic Over Time (Line Chart):

- **Chart type**: Time series (line chart)
- **Date range dimension**: Date
- **Metric**: Sessions
- **Breakdown dimension**: Session source
- **Filter**: AI Referral Sources
- **Style**:
  - Show data labels: On
  - Line smoothing: Medium
  - Colors: Custom palette for each AI platform

**[Screenshot: Time series chart showing AI traffic trends]**

---

#### 3. Top AI Referral Sources (Bar Chart):

- **Chart type**: Bar chart
- **Dimension**: Session source
- **Metrics**: Sessions, Users
- **Sort**: Sessions (descending)
- **Max bars**: 10
- **Filter**: AI Referral Sources

**[Screenshot: Bar chart of top AI referral sources]**

---

#### 4. Landing Pages from AI Traffic (Table):

- **Chart type**: Table
- **Dimensions**:
  - Landing page (primary)
  - Session source (secondary)
- **Metrics**:
  - Sessions
  - Users
  - Engagement rate
  - Average engagement time
- **Filter**: AI Referral Sources
- **Rows per page**: 20
- **Sort**: Sessions (descending)

**[Screenshot: Table showing landing pages and AI sources]**

---

#### 5. Geographic Distribution (Geo Map):

- **Chart type**: Geo map
- **Dimension**: Country
- **Metric**: Sessions
- **Filter**: AI Referral Sources
- **Style**:
  - Map type: World
  - Color scheme: Gradient (light to dark)

**[Screenshot: Geographic map of AI referral traffic]**

---

#### 6. Device Category Breakdown (Pie Chart):

- **Chart type**: Pie chart
- **Dimension**: Device category
- **Metric**: Sessions
- **Filter**: AI Referral Sources
- **Style**: Show percentages and values

**[Screenshot: Pie chart of device categories]**

---

### Step 5: Add Date Range Control

1. Click **Add a control** → **Date range control**
2. Position at the top of the dashboard
3. Set default range: Last 30 days
4. Enable comparison: Yes (compare to previous period)

**[Screenshot: Date range control]**

---

### Step 6: Dashboard Layout & Styling

#### Recommended Layout:

```
┌─────────────────────────────────────────────────────────────┐
│  [Date Range Control]                    [Last updated: XX] │
├─────────────────────────────────────────────────────────────┤
│  [Sessions] [Users] [Engagement Rate] [Conversions]         │
├─────────────────────────────────────────────────────────────┤
│  [AI Traffic Over Time - Line Chart]                        │
├──────────────────────────────┬──────────────────────────────┤
│  [Top AI Sources - Bar]      │  [Device Category - Pie]     │
├──────────────────────────────┴──────────────────────────────┤
│  [Geographic Distribution - Map]                            │
├─────────────────────────────────────────────────────────────┤
│  [Landing Pages Table]                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Styling Tips:

- Use consistent color scheme (brand colors)
- Set background color: `#F8F9FA` (light gray)
- Card backgrounds: White with subtle shadow
- Font: Google Sans or Roboto
- Header text size: 18pt
- Metric text size: 32pt (scorecards)

**[Screenshot: Final dashboard layout]**

---

### Step 7: Share & Schedule

#### Sharing:

1. Click **Share** (top right)
2. Add collaborators with edit/view permissions
3. Set link sharing: "Anyone with the link can view"

#### Email Scheduling (Optional):

1. Click **⋮** (three dots menu) → **Schedule email delivery**
2. Set frequency: Weekly (Monday mornings)
3. Recipients: Add team members
4. Subject: "Weekly AI Referral Traffic Report"

**[Screenshot: Share and schedule settings]**

---

## Part 3: Advanced Configurations

### Custom Calculated Fields

Create these calculated fields for deeper insights:

#### 1. AI Traffic Percentage:

```
Sessions (AI) / Sessions (All Traffic) * 100
```

#### 2. Conversion Rate from AI:

```
Conversions / Sessions * 100
```

#### 3. Value per AI Session:

```
Total Revenue / Sessions
```

**[Screenshot: Custom calculated field creation]**

---

### AI Platform Comparison Report

Create a secondary page for platform-specific analysis:

1. Add new page: "AI Platform Deep Dive"
2. Add filter control: Specific AI platform selector
3. Components:
   - Platform performance scorecard
   - User journey flow chart
   - Conversion funnel
   - Top content by platform

---

## Part 4: Monitoring & Optimization

### Key Metrics to Watch:

1. **Session growth** from AI platforms month-over-month
2. **Engagement rate** compared to overall site average
3. **Conversion rate** from AI traffic vs other sources
4. **Top performing content** for AI-referred users
5. **User retention** from AI traffic sources

### Weekly Review Checklist:

- [ ] Check for new AI platforms in referral data
- [ ] Update regex pattern if new AI sources appear
- [ ] Compare AI traffic quality (engagement, conversions) vs other channels
- [ ] Identify top-performing landing pages
- [ ] Review geographic trends
- [ ] Monitor device preferences from AI users

---

## Appendix: Regex Pattern Reference

### Full AI Referral Regex (Updated 2025):

```regex
(chat\.openai\.com|chatgpt\.com|claude\.ai|anthropic\.com|perplexity\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|bing\.com/chat|you\.com|phind\.com|poe\.com|character\.ai|forefront\.ai|writesonic\.com|jasper\.ai|sharegpt\.com|venice\.ai|grok\.x\.com|meta\.ai|pi\.ai|inflection\.ai|mistral\.ai|huggingface\.co/chat|cohere\.com|together\.ai|deepseek\.com)
```

### Breakdown by Platform Category:

#### Conversational AI:
- ChatGPT: `(chat\.openai\.com|chatgpt\.com)`
- Claude: `(claude\.ai|anthropic\.com)`
- Gemini/Bard: `(gemini\.google\.com|bard\.google\.com)`
- Grok: `grok\.x\.com`
- Meta AI: `meta\.ai`
- Pi: `(pi\.ai|inflection\.ai)`
- Character AI: `character\.ai`
- Poe: `poe\.com`

#### AI Search:
- Perplexity: `perplexity\.ai`
- You.com: `you\.com`
- Phind: `phind\.com`

#### AI Assistants:
- Microsoft Copilot: `(copilot\.microsoft\.com|bing\.com/chat)`

#### AI Development Platforms:
- Hugging Face Chat: `huggingface\.co/chat`
- Together AI: `together\.ai`
- Mistral: `mistral\.ai`
- Cohere: `cohere\.com`
- DeepSeek: `deepseek\.com`

#### Content AI:
- Jasper: `jasper\.ai`
- Writesonic: `writesonic\.com`
- Forefront: `forefront\.ai`

---

## Troubleshooting

### Issue: No data showing in GA4 Exploration

**Solution:**
1. Verify the regex pattern doesn't have syntax errors
2. Check if AI referral traffic exists in your property (check All Traffic report first)
3. Expand date range to last 90 days
4. Remove the segment filter temporarily to verify base data exists

### Issue: Looker Studio dashboard is slow

**Solution:**
1. Add date range limits (e.g., last 90 days max)
2. Use data extracts instead of live connection
3. Reduce the number of dimensions in complex tables
4. Enable data caching in report settings

### Issue: Regex not matching expected sources

**Solution:**
1. Check Session source values in GA4 (they may include `https://` prefix or query parameters)
2. Adjust regex to include protocol: `(https?://)?(chat\.openai\.com|...)`
3. Test regex at [regex101.com](https://regex101.com/) with sample URLs

---

## Next Steps

1. **Set up alerts**: Configure GA4 alerts for significant AI traffic spikes
2. **Create segments**: Build user segments for AI-referred users
3. **Attribution modeling**: Analyze AI referrals in multi-touch attribution
4. **Content optimization**: Identify and optimize high-performing pages for AI users
5. **Conversion tracking**: Set up specific conversion goals for AI traffic

---

**Last Updated**: November 19, 2025
**Maintained by**: Analytics Team
**Questions?**: Contact analytics@apex-intelligence.com
