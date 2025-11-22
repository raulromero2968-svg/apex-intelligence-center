# 🎯 APEX INTELLIGENCE - NOTION CMS INTEGRATION

**Date:** November 12, 2025  
**System:** Content Management & Publishing Pipeline  
**Status:** Ready to Build

---

## 📋 OVERVIEW

### What We're Building:
A complete Notion-powered CMS that lets you:
- Write Intel articles in Notion
- Auto-publish to website
- Manage content workflows
- Track performance
- Schedule releases
- Categorize and tag content

---

## 🗄️ NOTION DATABASE SCHEMAS

### Database 1: **Intel Articles** (Main Content)

**Purpose:** Store all TCG intelligence articles, market analysis, and insights

**Properties:**

| Property Name | Type | Description | Required |
|---------------|------|-------------|----------|
| Title | Title | Article headline | ✅ Yes |
| Slug | Text | URL-friendly identifier (auto-generated) | ✅ Yes |
| Status | Select | Draft, Review, Scheduled, Published, Archived | ✅ Yes |
| Published Date | Date | When to publish | ✅ Yes |
| Category | Select | Market Analysis, Price Tracking, News, Guide | ✅ Yes |
| Tags | Multi-select | TCG, Pokemon, Magic, Yu-Gi-Oh, Vintage, etc. | No |
| Excerpt | Text | Short description (150 chars) | ✅ Yes |
| Featured Image | Files | Hero image for article | ✅ Yes |
| Content | Rich Text | Full article content | ✅ Yes |
| Author | Person | Who wrote it | ✅ Yes |
| Tier | Select | Free, Premium | ✅ Yes |
| Views | Number | Page view count | No |
| Subscribers Added | Number | New subs from this article | No |
| Last Updated | Last Edited Time | Auto-tracked | No |

**Select Options:**

**Status:**
- 📝 Draft (red)
- 👀 Review (yellow)
- ⏰ Scheduled (blue)
- ✅ Published (green)
- 📦 Archived (gray)

**Category:**
- 📊 Market Analysis (cyan)
- 💰 Price Tracking (green)
- 📰 Breaking News (red)
- 📚 Strategy Guide (purple)
- 🎯 Investment Tips (orange)

**Tier:**
- 🆓 Free (green)
- ⭐ Premium (gold)

---

### Database 2: **Content Calendar** (Publishing Schedule)

**Purpose:** Plan and schedule content releases

**Properties:**

| Property Name | Type | Description |
|---------------|------|-------------|
| Week Starting | Date | Monday of the week |
| Article 1 | Relation | Link to Intel Articles |
| Article 2 | Relation | Link to Intel Articles |
| Article 3 | Relation | Link to Intel Articles |
| Newsletter Theme | Text | Weekly theme |
| Status | Select | Planning, In Progress, Complete |
| Notes | Text | Internal notes |

---

### Database 3: **Performance Metrics** (Analytics)

**Purpose:** Track content performance and engagement

**Properties:**

| Property Name | Type | Description |
|---------------|------|-------------|
| Article | Relation | Link to Intel Articles |
| Week | Date | Week of tracking |
| Page Views | Number | Total views |
| Unique Visitors | Number | Unique visitors |
| Avg Time on Page | Number | Seconds |
| Bounce Rate | Number | Percentage |
| Subscribers Added | Number | New subs |
| Social Shares | Number | Total shares |

---

### Database 4: **Asset Library** (Media Management)

**Purpose:** Organize images, charts, and media

**Properties:**

| Property Name | Type | Description |
|---------------|------|-------------|
| Asset Name | Title | File name |
| Type | Select | Image, Chart, Video, PDF |
| File | Files | The actual file |
| Used In | Relation | Link to articles |
| Tags | Multi-select | Categorization |
| Upload Date | Created Time | Auto-tracked |

---

## 🔧 NOTION API SETUP

### Step 1: Create Notion Integration

1. Go to: https://www.notion.so/my-integrations
2. Click: **"+ New integration"**
3. Fill in:
   - **Name:** Apex Intelligence CMS
   - **Associated workspace:** Your workspace
   - **Type:** Internal
   - **Capabilities:** 
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. Click: **"Submit"**
5. **Copy the API token** (starts with `secret_...`)

---

### Step 2: Share Databases with Integration

For EACH database you create:
1. Open the database in Notion
2. Click **"..."** (top right)
3. Click **"Connections"**
4. Search for: **"Apex Intelligence CMS"**
5. Click to add it

---

### Step 3: Get Database IDs

**Method: From URL**

1. Open each database in Notion
2. Look at the URL:
   ```
   https://www.notion.so/[DATABASE_ID]?v=...
   ```
3. Copy the DATABASE_ID (32 characters, no dashes)

**You'll need IDs for:**
- Intel Articles database
- Content Calendar database
- Performance Metrics database
- Asset Library database

---

## 🌐 CLOUDFLARE WORKER API

### Worker 1: **Notion Sync Worker**

**Purpose:** Fetch published articles from Notion and serve to website

**File:** `notion-sync.js`

```javascript
// Cloudflare Worker - Notion Sync API
// Deployed at: api.apexintelligence.io/articles

export default {
  async fetch(request, env) {
    const NOTION_TOKEN = env.NOTION_TOKEN;
    const DATABASE_ID = env.INTEL_ARTICLES_DB_ID;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };
    
    // Handle OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Query Notion database for published articles
      const response = await fetch(
        `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: {
              property: 'Status',
              select: {
                equals: 'Published'
              }
            },
            sorts: [
              {
                property: 'Published Date',
                direction: 'descending'
              }
            ]
          })
        }
      );
      
      const data = await response.json();
      
      // Transform Notion data to clean format
      const articles = data.results.map(page => {
        const props = page.properties;
        
        return {
          id: page.id,
          title: props.Title?.title[0]?.plain_text || '',
          slug: props.Slug?.rich_text[0]?.plain_text || '',
          excerpt: props.Excerpt?.rich_text[0]?.plain_text || '',
          category: props.Category?.select?.name || '',
          tags: props.Tags?.multi_select?.map(t => t.name) || [],
          tier: props.Tier?.select?.name || 'Free',
          publishedDate: props['Published Date']?.date?.start || '',
          featuredImage: props['Featured Image']?.files[0]?.file?.url || 
                          props['Featured Image']?.files[0]?.external?.url || '',
          url: `https://apexintelligence.io/intel/${props.Slug?.rich_text[0]?.plain_text}`,
        };
      });
      
      return new Response(
        JSON.stringify({ articles, count: articles.length }),
        { headers: corsHeaders }
      );
      
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
```

**Environment Variables to Set:**
- `NOTION_TOKEN` = Your Notion integration token
- `INTEL_ARTICLES_DB_ID` = Intel Articles database ID

---

### Worker 2: **Article Content Worker**

**Purpose:** Fetch full article content by slug

**File:** `notion-article.js`

```javascript
// Cloudflare Worker - Single Article API
// Deployed at: api.apexintelligence.io/article/:slug

export default {
  async fetch(request, env) {
    const NOTION_TOKEN = env.NOTION_TOKEN;
    const DATABASE_ID = env.INTEL_ARTICLES_DB_ID;
    
    const url = new URL(request.url);
    const slug = url.pathname.split('/').pop();
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Query database for article with matching slug
      const dbResponse = await fetch(
        `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filter: {
              and: [
                {
                  property: 'Slug',
                  rich_text: {
                    equals: slug
                  }
                },
                {
                  property: 'Status',
                  select: {
                    equals: 'Published'
                  }
                }
              ]
            }
          })
        }
      );
      
      const dbData = await dbResponse.json();
      
      if (dbData.results.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Article not found' }),
          { status: 404, headers: corsHeaders }
        );
      }
      
      const page = dbData.results[0];
      
      // Fetch page content blocks
      const blocksResponse = await fetch(
        `https://api.notion.com/v1/blocks/${page.id}/children`,
        {
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
          }
        }
      );
      
      const blocksData = await blocksResponse.json();
      
      // Parse article
      const props = page.properties;
      const article = {
        id: page.id,
        title: props.Title?.title[0]?.plain_text || '',
        slug: props.Slug?.rich_text[0]?.plain_text || '',
        excerpt: props.Excerpt?.rich_text[0]?.plain_text || '',
        category: props.Category?.select?.name || '',
        tags: props.Tags?.multi_select?.map(t => t.name) || [],
        tier: props.Tier?.select?.name || 'Free',
        publishedDate: props['Published Date']?.date?.start || '',
        featuredImage: props['Featured Image']?.files[0]?.file?.url || 
                        props['Featured Image']?.files[0]?.external?.url || '',
        content: blocksData.results, // Raw Notion blocks
      };
      
      return new Response(
        JSON.stringify(article),
        { headers: corsHeaders }
      );
      
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
```

---

## 🔄 WEBSITE INTEGRATION

### JavaScript to Fetch and Display Articles

**Add to your HTML (before closing `</body>` tag):**

```javascript
<script>
// Fetch articles from Notion API
async function loadIntelArticles() {
  try {
    const response = await fetch('https://api.apexintelligence.io/articles');
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      displayArticles(data.articles.slice(0, 3)); // Show latest 3
    }
  } catch (error) {
    console.error('Error loading articles:', error);
  }
}

// Display articles in the grid
function displayArticles(articles) {
  const grid = document.querySelector('.intel-grid');
  
  grid.innerHTML = articles.map(article => `
    <a href="${article.url}" class="intel-card">
      <div class="intel-content">
        <div class="intel-date">${formatDate(article.publishedDate)}</div>
        <h3 class="intel-title">${article.title}</h3>
        <p class="intel-excerpt">${article.excerpt}</p>
        ${article.tier === 'Premium' ? 
          '<span style="color: var(--apex-cyan); font-size: 0.875rem;">⭐ Premium</span>' : 
          ''}
      </div>
    </a>
  `).join('');
}

// Format date nicely
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Load articles on page load
document.addEventListener('DOMContentLoaded', loadIntelArticles);
</script>
```

---

## 🎯 PUBLISHING WORKFLOW

### How It Works:

1. **Write in Notion:**
   - Create new page in Intel Articles database
   - Write content
   - Add metadata (category, tags, etc.)
   - Upload featured image
   - Set status to "Draft"

2. **Review:**
   - Change status to "Review"
   - Get feedback
   - Make edits

3. **Schedule:**
   - Set Published Date
   - Change status to "Scheduled"
   - (Optional) Use automation to auto-publish

4. **Publish:**
   - Change status to "Published"
   - **Article automatically appears on website!**
   - No manual upload needed

5. **Track:**
   - View metrics in Performance Metrics database
   - See views, engagement, etc.

---

## 🚀 DEPLOYMENT STEPS

### Phase A: Set Up Notion (30 minutes)

1. ✅ Create Intel Articles database
2. ✅ Add all properties listed above
3. ✅ Create integration
4. ✅ Share database with integration
5. ✅ Get database ID
6. ✅ Write 1-2 test articles

### Phase B: Deploy Cloudflare Workers (20 minutes)

1. ✅ Create "notion-sync" worker
2. ✅ Add environment variables
3. ✅ Deploy and test endpoint
4. ✅ Create "notion-article" worker
5. ✅ Deploy and test

### Phase C: Update Website (10 minutes)

1. ✅ Add JavaScript fetch code
2. ✅ Test article loading
3. ✅ Verify formatting
4. ✅ Deploy to production

---

## 🎨 NOTION TEMPLATE

### Intel Article Template

**Copy this into your database:**

```
Title: [Your Article Title]
Slug: your-article-title
Status: Draft
Published Date: [Date]
Category: Market Analysis
Tags: TCG, Pokemon, Modern
Excerpt: A compelling 150-character summary that hooks readers...
Tier: Free
Author: [Your Name]

---

[Start writing your content here]

Use Notion's rich formatting:
- Headers
- Bullet points
- Images
- Callouts
- Code blocks
- Embeds

Everything syncs automatically!
```

---

## 📊 NEXT: GOOGLE WORKSPACE INTEGRATION

**After Notion is working, we'll add:**
- Google Sheets for analytics
- Google Drive for assets
- Gmail for subscriber management
- Calendar for scheduling

---

## 🔥 ADVANTAGES OF THIS SYSTEM

**For You:**
- ✅ Write in familiar Notion interface
- ✅ No coding required to publish
- ✅ Automatic formatting
- ✅ Built-in collaboration
- ✅ Version history
- ✅ Mobile app support

**For Your Site:**
- ✅ Always up-to-date content
- ✅ Fast loading (cached)
- ✅ SEO-friendly
- ✅ Professional appearance
- ✅ Scalable architecture

**For Your Workflow:**
- ✅ Write → Review → Publish in one place
- ✅ Schedule releases
- ✅ Track performance
- ✅ Collaborate with team (future)

---

## 🎯 READY TO BUILD?

**Let me know and I'll create:**
1. Notion database templates (ready to import)
2. Complete Cloudflare Worker code
3. Updated website with auto-sync
4. Step-by-step setup guide

**This will take ~1 hour to set up, then you can publish INSTANTLY forever!**

---

**End of Notion Integration Architecture**

*Let's build this!* 🚀
