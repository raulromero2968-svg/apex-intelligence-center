# Environment Variables Reference

This document lists all environment variables used in the Apex Intelligence platform. Use this as a reference when setting up Vercel or local development.

## Quick Setup for Vercel

Paste the following into **Vercel → Project Settings → Environment Variables**:

```bash
# Core (already used)
NODE_VERSION=20
PNPM_VERSION=10.19.0

# Feature flags
FEATURE_RESEARCH_STREAMING=0        # set to 1 when ready

# Optional for streaming mode
OPENAI_API_KEY=...
COHERE_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Complete Environment Variables List

### Core Runtime Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_VERSION` | Yes | `20` | Node.js version for Vercel builds |
| `PNPM_VERSION` | Yes | `10.19.0` | pnpm version for Vercel builds |

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FEATURE_RESEARCH_STREAMING` | No | `0` | Enable research streaming mode (set to `1` when ready) |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (Neon, Supabase, or self-hosted) |
| `POSTGRES_URL` | No | - | Alternative database URL (used as fallback) |

### AI/ML API Keys

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic API key for Claude 3.5 Sonnet (RAG) |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for GPT-4o (citation validation) |
| `VOYAGE_API_KEY` | Yes | - | Voyage AI API key for embeddings |
| `COHERE_API_KEY` | Yes | - | Cohere API key for reranking |

### Redis / Caching

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UPSTASH_REDIS_REST_URL` | No | - | Upstash Redis REST API URL (for caching and streaming) |
| `UPSTASH_REDIS_REST_TOKEN` | No | - | Upstash Redis REST API token |
| `REDIS_URL` | No | `redis://localhost:6379` | Standard Redis URL (for local development) |

### IPFS / Provenance

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PINATA_API_KEY` | No | - | Pinata API key for IPFS provenance logging |
| `PINATA_API_SECRET` | No | - | Pinata API secret |
| `PINATA_JWT` | No | - | Pinata JWT token (alternative to API key/secret) |

### Monitoring & Observability

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | No | - | Sentry DSN for error tracking (public, exposed to client) |
| `SENTRY_ORG` | No | - | Sentry organization slug |
| `SENTRY_PROJECT` | No | - | Sentry project slug |

### Notifications (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_WEBHOOK_URL` | No | - | Discord webhook URL for alerts |
| `TELEGRAM_BOT_TOKEN` | No | - | Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID` | No | - | Telegram chat ID for notifications |
| `VAPID_PUBLIC_KEY` | No | - | VAPID public key for web push notifications |
| `VAPID_PRIVATE_KEY` | No | - | VAPID private key for web push notifications |

### Development & Debugging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `preview`) |
| `LOG_DB_QUERIES` | No | `false` | Enable database query logging |
| `BASE_URL` | No | `http://localhost:3000` | Base URL for testing |
| `GIT_SHA` | No | - | Git commit SHA (auto-set by Vercel) |
| `VERCEL_GIT_COMMIT_SHA` | No | - | Vercel Git commit SHA (auto-set by Vercel) |

### CI/CD & Build Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CI` | No | `false` | CI environment detection |
| `GITHUB_ACTIONS` | No | `false` | GitHub Actions detection |
| `MAX_ROUTE_KB` | No | `500` | Maximum route bundle size (KB) |
| `MAX_CHUNK_KB` | No | `300` | Maximum chunk size (KB) |
| `MAX_FIRST_LOAD_KB` | No | `200` | Maximum first load size (KB) |
| `PERF_BUDGET_STRICT` | No | `0` | Enable strict performance budget checks |

## Setup Instructions

### For Local Development

1. Create a `.env.local` file in the project root
2. Copy the variables you need from the list above
3. Fill in your actual API keys and credentials
4. Never commit `.env.local` to git

### For Vercel Deployment

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add each variable for the appropriate environments:
   - **Production**: Live production environment
   - **Preview**: All preview deployments (PRs, branches)
   - **Development**: Local development with `vercel dev`
3. Use the "Quick Setup" section above for the minimum required variables

## Feature Flag Usage

### FEATURE_RESEARCH_STREAMING

Controls whether research queries use streaming mode:

```typescript
const enableStreaming = process.env.FEATURE_RESEARCH_STREAMING === '1';
```

When enabled:
- Responses stream to the client in real-time
- Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for caching
- Uses `OPENAI_API_KEY` for streaming responses

## Security Notes

- **Never commit API keys to git**
- Use Vercel's environment variable encryption
- Rotate keys regularly
- Use different keys for development and production
- `NEXT_PUBLIC_*` variables are exposed to the client - only use for public values

## Troubleshooting

### Missing API Key Errors

If you see errors about missing API keys:
1. Check that the variable is set in Vercel dashboard
2. Ensure it's set for the correct environment (Production/Preview/Development)
3. Redeploy after adding new variables
4. Check variable names for typos (case-sensitive)

### Redis Connection Issues

If streaming mode isn't working:
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
2. Check that Upstash Redis is active and accessible
3. Ensure `FEATURE_RESEARCH_STREAMING=1` is set

### Database Connection Issues

If database queries fail:
1. Verify `DATABASE_URL` is set correctly
2. Check that the database is accessible from Vercel's IP ranges
3. For Neon/Supabase, ensure connection pooling is configured

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Full deployment instructions
- [RAG Architecture](./RAG_ARCHITECTURE.md) - RAG system details
- [Contributing Guide](../CONTRIBUTING.md) - Development setup

