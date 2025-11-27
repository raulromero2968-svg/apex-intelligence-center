import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getArticleBySlug } from '@/lib/mdx';

// Required because we use fs/promises for MDX → cannot run in Edge runtime
export const runtime = 'nodejs';
// Allow ISR caching for OG images - revalidate every hour
// This improves performance while keeping images fresh
export const revalidate = 3600;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Check if this is a blog post request via slug
    const slug = searchParams.get('slug');
    let title = searchParams.get('title') || 'Apex Intelligence Center';
    let subtitle = searchParams.get('subtitle') || 'TCG Market Intelligence & Research';
    let category = searchParams.get('category') || '';

    // If slug is provided, fetch article data
    if (slug) {
      try {
        const article = await getArticleBySlug(slug);
        if (article) {
          title = article.frontmatter.title;
          subtitle = article.frontmatter.description || article.frontmatter.tags?.join(' • ') || subtitle;
          category = article.frontmatter.category;
        }
      } catch (error) {
        // If article not found, use defaults
        console.warn('Article not found for slug:', slug);
      }
    }

    // Brand colors from Tailwind config
    const colors = {
      cyan: '#00D9FF',
      purple: '#9333EA',
      magenta: '#FF00FF',
      ink: '#0A0E1A',
      inkLight: '#1a1f3a',
    };

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: colors.ink,
            backgroundImage: `linear-gradient(135deg, ${colors.ink} 0%, ${colors.inkLight} 100%)`,
            padding: '80px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header with category badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {category && (
              <div
                style={{
                  display: 'flex',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${colors.cyan}20, ${colors.purple}20)`,
                  border: `2px solid ${colors.cyan}`,
                  color: colors.cyan,
                  fontSize: '24px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                {category}
              </div>
            )}
          </div>

          {/* Main title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '1000px',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 800,
                lineHeight: '1.1',
                color: 'white',
                margin: 0,
                background: `linear-gradient(135deg, ${colors.cyan}, ${colors.purple})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {title}
            </h1>
          </div>

          {/* Footer with brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderTop: `2px solid ${colors.cyan}40`,
              paddingTop: '40px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: colors.cyan,
                  letterSpacing: '1px',
                }}
              >
                APEX INTELLIGENCE
              </div>
              <div
                style={{
                  fontSize: '24px',
                  color: colors.purple,
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </div>
            </div>

            {/* Wolf logo representation (since we can't easily load external images in edge runtime) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.cyan}30, ${colors.purple}30)`,
                border: `3px solid ${colors.cyan}`,
              }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke={colors.cyan}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke={colors.purple}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke={colors.magenta}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Add caching headers for CDN and browser caching
    // This improves performance and reduces server load
    imageResponse.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
    );

    return imageResponse;
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
