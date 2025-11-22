# 🚀 NOTION INTEGRATION - QUICK START GUIDE

**Time to Complete:** 30-45 minutes  
**Result:** Auto-publishing from Notion to your website!

---

## ✅ WHAT YOU'LL HAVE WHEN DONE:

- Write articles in Notion
- Click "Published" status
- **Articles automatically appear on apexintelligence.io**
- No code, no uploads, just write and publish!

---

## 📋 STEP 1: CREATE NOTION DATABASE (10 minutes)

### A. Create New Database

1. Open Notion
2. Click **"+ New page"**
3. Type: **"Intel Articles"**
4. Select: **"Table - Database"**

### B. Add These Properties (columns):

**Click "+ " to add each property:**

| Property Name | Type | Config |
|---------------|------|--------|
| Title | Title | (auto-created) |
| Slug | Text | - |
| Status | Select | Options: Draft, Review, Scheduled, Published, Archived |
| Published Date | Date | - |
| Category | Select | Options: Market Analysis, Price Tracking, News, Guide |
| Tags | Multi-select | Add: TCG, Pokemon, Magic, Yu-Gi-Oh, Vintage |
| Excerpt | Text | - |
| Featured Image | Files & media | - |
| Tier | Select | Options: Free, Premium |
| Views | Number | - |

### C. Add Color to Status Options

1. Click **Status** column header
2. Click **Edit property**
3. For each option, pick a color:
   - Draft → Red
   - Review → Yellow  
   - Scheduled → Blue
   - Published → Green
   - Archived → Gray

---

## 🔑 STEP 2: CREATE NOTION INTEGRATION (5 minutes)

### A. Create Integration

1. Go to: https://www.notion.so/my-integrations
2. Click: **"+ New integration"**
3. Fill in:
   - Name: `Apex Intelligence CMS`
   - Logo: (optional)
   - Associated workspace: Select your workspace
   - Type: **Internal**
   - Capabilities:
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. Click: **"Submit"**
5. **COPY THE TOKEN** (starts with `secret_...`)
   - Save this somewhere safe!

### B. Connect Database to Integration

1. Open your **"Intel Articles"** database in Notion
2. Click the **"..."** menu (top right)
3. Click: **"Connections"** or **"Add connections"**
4. Search for: **"Apex Intelligence CMS"**
5. Click it to add
6. ✅ Now the integration can access this database!

### C. Get Database ID

1. Click **"Share"** on your database
2. Click **"Copy link"**
3. The URL looks like:
   ```
   https://www.notion.so/[WORKSPACE]/[DATABASE_ID]?v=...
   ```
4. **Copy the DATABASE_ID part** (32 characters)
   - Example: `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d`
5. Save this too!

---

## ☁️ STEP 3: DEPLOY CLOUDFLARE WORKER (15 minutes)

### A. Create Worker in Cloudflare

1. Go to: https://dash.cloudflare.com
2. Click: **"Workers & Pages"**
3. Click: **"Create application"**
4. Click: **"Create Worker"**
5. Name it: `apex-notion-api`
6. Click: **"Deploy"**

### B. Add Your Code

1. Click: **"Edit code"**
2. **Select all** the default code (Ctrl+A / Cmd+A)
3. **Delete it**
4. Open the file: `cloudflare-notion-sync-worker.js` (I just created)
5. **Copy ALL the code**
6. **Paste** into Cloudflare editor
7. Click: **"Save and deploy"**

### C. Add Environment Variables

1. Click: **"Settings"** tab
2. Click: **"Variables and Secrets"**
3. Click: **"Add variable"**
4. Add these TWO variables:

**Variable 1:**
- Name: `NOTION_TOKEN`
- Value: (paste your Notion integration token from Step 2A)
- Click **"Encrypt"** (optional but recommended)
- Click **"Add variable"**

**Variable 2:**
- Name: `INTEL_ARTICLES_DB_ID`
- Value: (paste your database ID from Step 2C)
- Click **"Add variable"**

5. Click: **"Save"**
6. Click: **"Deploy"** to restart worker

### D. Test Your API

1. Copy your worker URL (e.g., `apex-notion-api.username.workers.dev`)
2. Add `/articles` to the end
3. Open in browser: `https://apex-notion-api.username.workers.dev/articles`
4. You should see: `{"articles": [], "count": 0, ...}`
   - Empty is OK for now! Means it's working!

---

## ✍️ STEP 4: WRITE TEST ARTICLE (5 minutes)

### A. Add First Article

1. Open your **Intel Articles** database
2. Click **"+ New"** to create a page
3. Fill in:
   - **Title:** "Welcome to Apex Intelligence"
   - **Slug:** "welcome" (URL-friendly, no spaces)
   - **Status:** Published
   - **Published Date:** Today
   - **Category:** News
   - **Tags:** TCG
   - **Excerpt:** "Your source for data-driven TCG intelligence"
   - **Tier:** Free
4. Write some content in the page
5. Upload a featured image (optional but recommended)

### B. Test API Again

1. Go back to: `https://your-worker.workers.dev/articles`
2. Refresh the page
3. You should now see your article in JSON!
4. ✅ **IT WORKS!**

---

## 🌐 STEP 5: UPDATE WEBSITE (10 minutes)

### A. Add Fetch Script to Website

Open your website HTML and add this script before `</body>`:

```javascript
<script>
// API Configuration
const NOTION_API = 'https://apex-notion-api.YOUR-USERNAME.workers.dev';

// Fetch and display articles
async function loadIntelArticles() {
  try {
    const response = await fetch(`${NOTION_API}/articles`);
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      displayArticles(data.articles.slice(0, 3)); // Show latest 3
    }
  } catch (error) {
    console.error('Error loading articles:', error);
    // Keep placeholder cards if fetch fails
  }
}

// Display articles in the grid
function displayArticles(articles) {
  const grid = document.querySelector('.intel-grid');
  
  if (!grid) return;
  
  grid.innerHTML = articles.map(article => `
    <a href="${article.url}" class="intel-card">
      ${article.featuredImage ? `
        <div style="width: 100%; height: 200px; overflow: hidden; border-radius: 12px 12px 0 0;">
          <img src="${article.featuredImage}" 
               alt="${article.title}" 
               style="width: 100%; height: 100%; object-fit: cover;">
        </div>
      ` : ''}
      <div class="intel-content">
        <div class="intel-date">${formatDate(article.publishedDate)}</div>
        <h3 class="intel-title">${article.title}</h3>
        <p class="intel-excerpt">${article.excerpt}</p>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
          ${article.category ? `
            <span style="background: rgba(0, 255, 240, 0.1); color: var(--apex-cyan); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem;">
              ${article.category}
            </span>
          ` : ''}
          ${article.tier === 'Premium' ? `
            <span style="background: rgba(255, 215, 0, 0.1); color: gold; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem;">
              ⭐ Premium
            </span>
          ` : ''}
        </div>
      </div>
    </a>
  `).join('');
}

// Format date nicely
function formatDate(dateString) {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Load on page ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadIntelArticles);
} else {
  loadIntelArticles();
}
</script>
```

**Important:** Replace `YOUR-USERNAME` with your actual Cloudflare worker URL!

### B. Deploy Updated Website

1. Copy your full HTML file
2. Paste into your Cloudflare Worker
3. Save and Deploy
4. Visit apexintelligence.io
5. ✅ **Your Notion article should appear!**

---

## 🎉 DONE! NOW TEST IT:

### Publishing Workflow:

1. Write new article in Notion
2. Fill in all properties
3. Change **Status** to **"Published"**
4. Wait 5 minutes (cache refresh)
5. Refresh apexintelligence.io
6. **Article appears automatically!** ✨

---

## 🔧 TROUBLESHOOTING

### Articles Not Showing Up?

**Check 1: API Working?**
- Visit: `https://your-worker.workers.dev/articles`
- Should return JSON with your articles
- If error, check environment variables

**Check 2: Database Connected?**
- Go to Notion database
- Click "..." → Connections
- Confirm "Apex Intelligence CMS" is listed

**Check 3: Article Published?**
- Status must be exactly "Published" (case-sensitive)
- Published Date should be filled in

**Check 4: Worker URL Correct?**
- Check the API URL in your website code
- Should match your actual worker URL

### API Returns Empty Array?

- Confirm Status = "Published"
- Check database is shared with integration
- Try creating a new test article

### CORS Errors?

- Worker should have CORS headers (already in code)
- Check browser console for specific error
- May need to redeploy worker

---

## 📈 NEXT STEPS

### Add More Articles
- Create 2-3 more articles
- Test different categories
- Try Premium tier

### Customize Display
- Adjust how articles look
- Add more metadata
- Create article detail pages

### Add Analytics
- Track views in Notion
- Monitor which articles perform best
- Use data to improve content

---

## 🎯 YOU DID IT!

**You now have:**
- ✅ Notion CMS for writing
- ✅ Cloudflare API for serving
- ✅ Auto-sync to website
- ✅ Professional publishing workflow

**No more manual uploads!**  
**Just write in Notion and publish!** 🚀

---

**Need help? Common issues and solutions in the architecture doc!**
