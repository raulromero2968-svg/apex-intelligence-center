// CLOUDFLARE WORKER: Notion Sync API
// Deploy at: api.apexintelligence.io or as a route on your main worker
// Purpose: Fetch published Intel articles from Notion and serve to website

export default {
  async fetch(request, env, ctx) {
    // Configuration
    const NOTION_TOKEN = env.NOTION_TOKEN; // Set in Worker environment
    const DATABASE_ID = env.INTEL_ARTICLES_DB_ID; // Set in Worker environment
    
    // CORS headers for allowing website to fetch
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };
    
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        headers: corsHeaders,
        status: 204
      });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route: /articles - Get all published articles
      if (path === '/articles' || path === '/articles/') {
        return await getPublishedArticles(NOTION_TOKEN, DATABASE_ID, corsHeaders);
      }
      
      // Route: /article/:slug - Get single article by slug
      if (path.startsWith('/article/')) {
        const slug = path.split('/').pop();
        return await getArticleBySlug(NOTION_TOKEN, DATABASE_ID, slug, corsHeaders);
      }
      
      // Route: /sync - Manual trigger to update cache (optional)
      if (path === '/sync') {
        // Force refresh of cached data
        return await getPublishedArticles(NOTION_TOKEN, DATABASE_ID, corsHeaders, true);
      }
      
      // Default: Return API info
      return new Response(
        JSON.stringify({
          name: 'Apex Intelligence Notion API',
          version: '1.0',
          endpoints: {
            articles: '/articles - Get all published articles',
            article: '/article/:slug - Get specific article',
            sync: '/sync - Force cache refresh'
          }
        }),
        { headers: corsHeaders }
      );
      
    } catch (error) {
      console.error('API Error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          message: error.message 
        }),
        { 
          status: 500, 
          headers: corsHeaders 
        }
      );
    }
  }
};

// Get all published articles from Notion
async function getPublishedArticles(notionToken, databaseId, corsHeaders, forceRefresh = false) {
  try {
    // Query Notion database
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
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
          ],
          page_size: 100 // Max articles to fetch
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform Notion pages to clean article format
    const articles = data.results.map(page => transformNotionPage(page));
    
    // Filter out any articles with missing required fields
    const validArticles = articles.filter(a => a.title && a.slug);
    
    return new Response(
      JSON.stringify({ 
        articles: validArticles,
        count: validArticles.length,
        lastUpdated: new Date().toISOString()
      }),
      { 
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
    
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}

// Get single article by slug
async function getArticleBySlug(notionToken, databaseId, slug, corsHeaders) {
  try {
    // Query database for article with matching slug
    const dbResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
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
    
    if (!dbResponse.ok) {
      throw new Error(`Notion API error: ${dbResponse.status}`);
    }
    
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
      `https://api.notion.com/v1/blocks/${page.id}/children?page_size=100`,
      {
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28',
        }
      }
    );
    
    if (!blocksResponse.ok) {
      throw new Error(`Notion blocks API error: ${blocksResponse.status}`);
    }
    
    const blocksData = await blocksResponse.json();
    
    // Transform page data
    const article = transformNotionPage(page);
    
    // Add content blocks (converted to HTML)
    article.content = blocksData.results;
    article.contentHtml = notionBlocksToHtml(blocksData.results);
    
    return new Response(
      JSON.stringify(article),
      { 
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
        }
      }
    );
    
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
}

// Transform Notion page to clean article object
function transformNotionPage(page) {
  const props = page.properties;
  
  // Helper to safely extract text from Notion rich text
  const getRichText = (prop) => {
    return prop?.rich_text?.[0]?.plain_text || '';
  };
  
  // Helper to get select value
  const getSelect = (prop) => {
    return prop?.select?.name || '';
  };
  
  // Helper to get multi-select values
  const getMultiSelect = (prop) => {
    return prop?.multi_select?.map(item => item.name) || [];
  };
  
  // Helper to get file URL
  const getFileUrl = (prop) => {
    return prop?.files?.[0]?.file?.url || 
           prop?.files?.[0]?.external?.url || '';
  };
  
  // Helper to get date
  const getDate = (prop) => {
    return prop?.date?.start || '';
  };
  
  // Helper to get number
  const getNumber = (prop) => {
    return prop?.number || 0;
  };
  
  const title = props.Title?.title?.[0]?.plain_text || '';
  const slug = getRichText(props.Slug);
  
  return {
    id: page.id,
    title: title,
    slug: slug,
    excerpt: getRichText(props.Excerpt),
    category: getSelect(props.Category),
    tags: getMultiSelect(props.Tags),
    tier: getSelect(props.Tier) || 'Free',
    publishedDate: getDate(props['Published Date']),
    featuredImage: getFileUrl(props['Featured Image']),
    views: getNumber(props.Views),
    url: `https://apexintelligence.io/intel/${slug}`,
    notionUrl: page.url,
    lastUpdated: page.last_edited_time,
  };
}

// Convert Notion blocks to HTML
function notionBlocksToHtml(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
        return `<p>${text}</p>`;
      
      case 'heading_1':
        const h1 = block.heading_1.rich_text.map(t => t.plain_text).join('');
        return `<h1>${h1}</h1>`;
      
      case 'heading_2':
        const h2 = block.heading_2.rich_text.map(t => t.plain_text).join('');
        return `<h2>${h2}</h2>`;
      
      case 'heading_3':
        const h3 = block.heading_3.rich_text.map(t => t.plain_text).join('');
        return `<h3>${h3}</h3>`;
      
      case 'bulleted_list_item':
        const li = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
        return `<li>${li}</li>`;
      
      case 'numbered_list_item':
        const nli = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
        return `<li>${nli}</li>`;
      
      case 'quote':
        const quote = block.quote.rich_text.map(t => t.plain_text).join('');
        return `<blockquote>${quote}</blockquote>`;
      
      case 'code':
        const code = block.code.rich_text.map(t => t.plain_text).join('');
        return `<pre><code>${code}</code></pre>`;
      
      case 'divider':
        return '<hr>';
      
      case 'image':
        const imgUrl = block.image.file?.url || block.image.external?.url;
        return `<img src="${imgUrl}" alt="Article image">`;
      
      default:
        return '';
    }
  }).join('\n');
}
