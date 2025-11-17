# Documentation Index

## Quick Start

1. **Development Setup**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
2. **Cursor Configuration**: See [CURSOR_SETUP.md](./CURSOR_SETUP.md)
3. **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **RAG Architecture**: See [RAG_ARCHITECTURE.md](./RAG_ARCHITECTURE.md)

## Project Documentation

### Development
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development environment setup
- [CURSOR_SETUP.md](./CURSOR_SETUP.md) - Complete Cursor + Claude 4 Opus guide
- [RAG_ARCHITECTURE.md](./RAG_ARCHITECTURE.md) - LanceDB + Grok-3 hybrid RAG

### Deployment
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel production deployment guide

### Implementation Phases
- [../PHASE2_IMPLEMENTATION.md](../PHASE2_IMPLEMENTATION.md) - Pop Delta Alerts & Portfolio
- [../BACKTESTING.md](../BACKTESTING.md) - Risk Rules v3 & MTG/YuGiOh backtesting
- [../POKEMON_BACKTESTING.md](../POKEMON_BACKTESTING.md) - Pokemon strategies & Optimizer v3
- [../PHASE4_YUGIOH_ONEPIECE.md](../PHASE4_YUGIOH_ONEPIECE.md) - YuGiOh full market & One Piece TCG

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (React Query)

### Backend
- **API**: tRPC + Next.js API Routes
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Vector DB**: LanceDB
- **Caching**: Redis (Upstash)

### AI/ML
- **Primary LLM**: Claude 4 Opus (Anthropic)
- **Local Models**: Qwen 2.5 72B, Llama 3.3 405B (via Ollama)
- **Tool Calling**: Grok-3 (xAI)
- **Embeddings**: Voyage AI (voyage-3.5-large) + Nomic Embed Text
- **Reranking**: Cohere rerank-english-v3.0

### Infrastructure
- **Hosting**: Vercel
- **Database**: Neon (Serverless PostgreSQL)
- **Monitoring**: Sentry
- **Job Queue**: BullMQ + Redis
- **Provenance**: IPFS (Pinata)

## Key Features

### Core RAG Engine
- Voyage AI embeddings (1024 dimensions)
- RAG-Fusion with 6 diverse queries
- IPFS provenance logging
- EU AI Act compliance
- Claude 3.5 Sonnet generation
- LLM judge citation validation

### Backtesting Strategies
1. **Modern MTG** (2011-2025): 68% CAGR, 4.8 Sharpe
2. **YuGiOh LOB** (2002-2025): 46% CAGR, 5.1 Sharpe
3. **YuGiOh Full** (2002-2025): 71% CAGR, 6.7 Sharpe
4. **Pokemon Vintage** (1999-2025): 84% CAGR, 5.6 Sharpe
5. **Pokemon SV** (2022-2025): 247% CAGR, 4.5 Sharpe
6. **One Piece TCG** (2022-2025): 142% CAGR, 7.2 Sharpe

### Risk Management
- Risk Rules v3 (11-line one-liner)
- Real-time portfolio alerts
- Multi-factor risk scoring
- Automatic rebalancing suggestions

### Portfolio Optimization
- Optimizer v8 (integer-constrained QP)
- <18ms for 500-card universe
- Full efficient frontier computation
- YuGiOh reprint hedge allocation

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start Ollama (if using local models)
OLLAMA_MAX_LOADED_MODELS=1 ollama serve

# Run linter
pnpm lint

# Type check
pnpm type-check
```

### Cursor Workflow
1. Open project in Cursor
2. Press `Cmd+K` for inline code generation
3. Use `.cursor/rules/` for project-specific instructions
4. Agent Mode: `Cmd+K` → Composer → Enable Agent Mode v2

### Deployment
```bash
# Build for production
pnpm build

# Deploy to Vercel
vercel --prod
```

## Troubleshooting

See individual documentation files for detailed troubleshooting:
- **Cursor issues**: [CURSOR_SETUP.md](./CURSOR_SETUP.md#troubleshooting)
- **Deployment issues**: [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting-quick-reference)
- **RAG issues**: [RAG_ARCHITECTURE.md](./RAG_ARCHITECTURE.md)

## Contributing

1. Create feature branch from `main`
2. Make changes following project conventions
3. Test locally with `pnpm dev`
4. Submit PR with clear description

## Support

For issues or questions:
- Check documentation files first
- Review troubleshooting sections
- Check GitHub issues
- Contact development team

---

*Last updated: November 17, 2025*
